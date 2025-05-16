"""
Audio processor for handling audio files with transcription capabilities.
"""
import os
import json
import asyncio
import tempfile
from typing import Dict, Any, Optional, List
import mimetypes

import os

try:
    import whisper
    import numpy as np
    WHISPER_AVAILABLE = True
except ImportError:
    # Fallback to basic functionality if dependencies aren't available
    WHISPER_AVAILABLE = False
    print("Warning: Local whisper is not available. Will use OpenAI API for transcription.")
    
    # Create a dummy class for type checking
    class DummyWhisper:
        @staticmethod
        def load_model(*args, **kwargs):
            return None
            
# We'll use OpenAI's API directly for transcription
try:
    import openai
    from openai import OpenAI
    OPENAI_AVAILABLE = True
    
    # Initialize the OpenAI client with the API key from environment variables
    try:
        OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
        if OPENAI_API_KEY:
            openai_client = OpenAI(api_key=OPENAI_API_KEY)
            print("OpenAI API client initialized for audio transcription")
        else:
            OPENAI_AVAILABLE = False
            print("Warning: OPENAI_API_KEY not found in environment variables")
    except Exception as e:
        OPENAI_AVAILABLE = False
        print(f"Error initializing OpenAI client: {str(e)}")
        
except ImportError:
    OPENAI_AVAILABLE = False
    print("Warning: openai package not available. Install with 'pip install openai'.")

# Import the utility module for LangChain compatibility
from .langchain_utils import (
    get_llm, 
    create_prompt, 
    run_llm_chain, 
    LANGCHAIN_AVAILABLE
)

from .base_processor import BaseProcessor

class AudioProcessor(BaseProcessor):
    """Processor for audio files with transcription capabilities"""
    
    def __init__(self):
        """Initialize the audio processor"""
        super().__init__()
        self.name = "AudioProcessor"
        
        # Initialize the language model using our utility function
        self.llm = get_llm(model_name="gpt-4-turbo", temperature=0.2)
        
        # Set up transcription engine (lazy initialization)
        self._transcription_model = None
        
        # Set up templates
        self.system_template = """You are an Audio Transcriber, an AI trained to analyze audio transcripts and extract structured information.
        
Your task is to analyze the provided audio transcript and transform it into a clean, structured JSON format.

Follow these guidelines:
1. Identify speakers if multiple people are talking
2. Organize content by topics or segments when appropriate
3. Include timestamps if available
4. Extract key points, facts, and important information
5. Structure the output as a valid JSON object
6. Identify questions and answers if present
7. Note any keywords or terms that seem significant
8. For interviews, clearly separate interviewer and interviewee
9. If there are unclear or [inaudible] sections, note them
10. Include any relevant metadata about the audio

{instructions}
"""
        
    @property
    def transcription_model(self):
        """Lazy initialization of transcription model"""
        if self._transcription_model is None:
            try:
                self._transcription_model = whisper.load_model("base")
            except Exception as e:
                print(f"Warning: Failed to initialize Whisper model: {str(e)}")
                self._transcription_model = None
        return self._transcription_model
        
    async def _transcribe_audio(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribe audio file using OpenAI API or Whisper (if available)
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Dict with transcription results
        """
        # Try using OpenAI API first (if available)
        if OPENAI_AVAILABLE and os.environ.get("OPENAI_API_KEY"):
            try:
                print(f"Using OpenAI API for transcribing: {audio_path}")
                
                # Ensure the file exists
                if not os.path.exists(audio_path):
                    return {
                        "text": f"Error: File not found at {audio_path}",
                        "segments": [],
                        "metadata": {
                            "file_path": audio_path,
                            "status": "file_not_found"
                        }
                    }
                
                # Use asyncio to run the OpenAI API call in a non-blocking way
                async def transcribe_with_openai():
                    try:
                        with open(audio_path, "rb") as audio_file:
                            # Call OpenAI's audio transcription API
                            response = openai_client.audio.transcriptions.create(
                                model="whisper-1",
                                file=audio_file,
                                response_format="verbose_json"
                            )
                            
                            # Process the response
                            if hasattr(response, 'text'):
                                main_text = response.text
                                segments = []
                                
                                # If we have segments, process them
                                if hasattr(response, 'segments'):
                                    for idx, segment in enumerate(response.segments):
                                        segments.append({
                                            "id": idx,
                                            "start": segment.get('start', 0),
                                            "end": segment.get('end', 0),
                                            "text": segment.get('text', ''),
                                            "confidence": segment.get('confidence', 1.0)
                                        })
                                
                                return {
                                    "text": main_text,
                                    "segments": segments,
                                    "metadata": {
                                        "file_path": audio_path,
                                        "status": "completed",
                                        "provider": "openai_api"
                                    }
                                }
                            else:
                                return {
                                    "text": str(response),
                                    "segments": [],
                                    "metadata": {
                                        "file_path": audio_path,
                                        "status": "completed",
                                        "provider": "openai_api"
                                    }
                                }
                    except Exception as e:
                        print(f"Error using OpenAI API for transcription: {str(e)}")
                        return None
                
                # Run the OpenAI transcription
                result = await transcribe_with_openai()
                if result:
                    return result
                    
                # If OpenAI API failed, continue to local whisper if available
                print("OpenAI API transcription failed, falling back to local whisper if available")
            except Exception as e:
                print(f"Error using OpenAI API for transcription: {str(e)}")
                # Continue to try local whisper if available
        
        # Fall back to local whisper if available
        if WHISPER_AVAILABLE:
            # Check if we have a model
            if not self.transcription_model:
                return {
                    "text": "Transcription model could not be initialized",
                    "segments": [],
                    "metadata": {
                        "file_path": audio_path,
                        "status": "model_init_failed"
                    }
                }
                
            try:
                # Run transcription (wrap in asyncio.to_thread for async execution)
                result = await asyncio.to_thread(self.transcription_model.transcribe, audio_path)
                
                # Extract segments with timestamps
                segments = []
                for segment in result.get('segments', []):
                    segments.append({
                        "id": segment.get('id', 0),
                        "start": segment.get('start', 0),
                        "end": segment.get('end', 0),
                        "text": segment.get('text', ''),
                        "confidence": segment.get('confidence', 0)
                    })
                    
                return {
                    "text": result.get('text', ''),
                    "segments": segments,
                    "metadata": {
                        "file_path": audio_path,
                        "status": "completed",
                        "provider": "whisper_local"
                    }
                }
            except Exception as e:
                print(f"Error using local whisper for transcription: {str(e)}")
        
        # If all methods failed, return an error
        return {
            "text": "Audio transcription failed - no available transcription methods",
            "segments": [],
            "metadata": {
                "file_path": audio_path,
                "status": "transcription_failed",
                "error": "No working transcription methods available"
            }
        }
        
    async def process(self, file_path: str, instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Process an audio file and extract transcription and structured information
        
        Args:
            file_path: Path to the audio file
            instructions: Optional specific instructions for processing
            
        Returns:
            Dict with processing results
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Get file metadata
        metadata = self._get_file_metadata(file_path)
        
        # Custom instructions handling
        instruction_text = ""
        if instructions:
            instruction_text = f"Additional instructions: {instructions}"
            
        # Transcribe the audio
        transcription = await self._transcribe_audio(file_path)
        
        # If transcription failed or is empty, return early
        if not transcription.get('text'):
            return {
                "audio_processing_result": {
                    "error": "Failed to transcribe audio or no speech detected",
                    "metadata": metadata
                },
                "file_type": "audio",
                "mime_type": mimetypes.guess_type(file_path)[0] or "audio/mpeg"
            }
        
        # Create a proper prompt using our utility function
        prompt = create_prompt(
            system_template=self.system_template.format(instructions=instruction_text),
            human_template="Here is the audio transcript to analyze and extract information from:\n\n{transcript}"
        )
        
        # Run the LLM chain using our utility function
        result_dict = await run_llm_chain(prompt, self.llm, {"transcript": transcription['text']})
        
        # Create a compatible result object
        if result_dict.get("success", False):
            result_content = result_dict.get("content", "")
        else:
            error_msg = result_dict.get("error", "Unknown error")
            result_content = f"Error processing audio from {file_path}: {error_msg}"
        
        # Extract structured data
        analysis = result_content
        
        # Try to parse as JSON if it looks like JSON
        structured_data = {}
        try:
            # Check if the result contains a JSON object
            if "{" in analysis and "}" in analysis:
                # Try to extract JSON from the text
                json_start = analysis.find("{")
                json_end = analysis.rfind("}") + 1
                json_str = analysis[json_start:json_end]
                
                structured_data = json.loads(json_str)
            else:
                # If not JSON, keep as text
                structured_data = {"analysis": analysis}
        except json.JSONDecodeError:
            # If JSON parsing fails, keep as text
            structured_data = {"analysis": analysis}
        
        # Combine transcription and analysis results
        result = {
            "transcription": transcription,
            "analysis": structured_data,
            "metadata": metadata
        }
        
        return {
            "audio_processing_result": result,
            "file_type": "audio",
            "mime_type": mimetypes.guess_type(file_path)[0] or "audio/mpeg"
        }
        
    async def run_with_tracing(self, file_path: str, instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Process an audio file with tracing if available, falls back to regular processing if not
        
        Args:
            file_path: Path to the audio file
            instructions: Optional specific instructions for processing
            
        Returns:
            Dict with processing results structured for the API response
        """
        try:
            # Get result from process method
            result = await self.process(file_path, instructions)
            
            # Format for API response
            return {
                "status": "completed",
                "audio_processing_result": result.get("audio_processing_result", {}),
                "file_path": file_path,
                "file_type": "audio",
                "instructions": instructions
            }
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            print(f"Error in run_with_tracing for AudioProcessor: {str(e)}\n{error_traceback}")
            
            return {
                "status": "error",
                "error": str(e),
                "traceback": error_traceback,
                "file_path": file_path,
                "file_type": "audio"
            }
