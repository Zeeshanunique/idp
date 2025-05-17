"""
Audio processor for handling audio files with transcription capabilities.
"""
import os
import json
import asyncio
import tempfile
import traceback
from typing import Dict, Any, Optional, List
import mimetypes

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
            # Create a client with the API key
            openai_client = OpenAI(api_key=OPENAI_API_KEY)
            
            # Print information about the API key for debugging
            masked_key = OPENAI_API_KEY[:8] + "..." + OPENAI_API_KEY[-4:]
            print(f"OpenAI API client initialized with key: {masked_key}")
            
            # Verify if the key is a project-based key (which may not work with audio APIs)
            if OPENAI_API_KEY.startswith("sk-proj-"):
                print("Warning: Using a project-scoped API key (sk-proj-). These keys may not work with audio transcription.")
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
        Transcribe audio file using OpenAI API, Whisper (if available), or fallback to audio analysis
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Dict with transcription results
        """
        # First check if file exists
        if not os.path.exists(audio_path):
            return {
                "text": f"Error: File not found at {audio_path}",
                "segments": [],
                "metadata": {
                    "file_path": audio_path,
                    "status": "file_not_found"
                }
            }
            
        # Check file size and format - this will be useful for audio analysis
        try:
            file_size = os.path.getsize(audio_path) / (1024 * 1024)  # Convert to MB
            file_extension = os.path.splitext(audio_path)[1].lower()
            print(f"Processing audio file: {os.path.basename(audio_path)}")
            print(f"File size: {file_size:.2f} MB, Format: {file_extension}")
        except Exception as e:
            print(f"Error getting file info: {str(e)}")
            
        # Try using OpenAI API first (if available and not using a project-scoped key)
        if OPENAI_AVAILABLE and os.environ.get("OPENAI_API_KEY"):
            api_key = os.environ.get("OPENAI_API_KEY")
            # Skip if project-scoped key
            if api_key.startswith("sk-proj-"):
                print("Skipping OpenAI API transcription because a project-scoped key is being used")
            else:
                try:
                    print(f"Using OpenAI API for transcribing: {audio_path}")
                    
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
                                    # Try to extract text from different response formats
                                    if isinstance(response, dict) and 'text' in response:
                                        return {
                                            "text": response['text'],
                                            "segments": [],
                                            "metadata": {
                                                "file_path": audio_path,
                                                "status": "completed",
                                                "provider": "openai_api"
                                            }
                                        }
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
        
        # Try basic audio info extraction as a last resort
        try:
            # Get basic audio file info as a fallback
            import wave
            
            try:
                with wave.open(audio_path, 'rb') as wav_file:
                    # Extract basic audio properties
                    channels = wav_file.getnchannels()
                    sample_width = wav_file.getsampwidth()
                    framerate = wav_file.getframerate()
                    frames = wav_file.getnframes()
                    duration = frames / float(framerate)
                    
                    # Create a basic transcription message
                    message = f"[Audio file detected: {os.path.basename(audio_path)}. Duration: {duration:.2f} seconds. "
                    message += f"Audio format: {channels} channel(s), {framerate} Hz sample rate.]"
                    
                    return {
                        "text": message,
                        "segments": [],
                        "metadata": {
                            "file_path": audio_path,
                            "status": "basic_info_only",
                            "error": "Transcription unavailable - falling back to basic audio info",
                            "audio_info": {
                                "channels": channels,
                                "sample_width": sample_width,
                                "framerate": framerate,
                                "duration": duration
                            }
                        }
                    }
            except Exception as e:
                print(f"Error reading WAV file: {str(e)}")
                
                # For non-WAV files or invalid WAV files, provide basic file info
                file_size = os.path.getsize(audio_path) / (1024 * 1024)  # Size in MB
                file_extension = os.path.splitext(audio_path)[1].lower()
                
                # Create a basic info message for non-WAV files
                message = f"[Audio file detected: {os.path.basename(audio_path)}. "
                message += f"File size: {file_size:.2f} MB. Format: {file_extension}]"
                
                # For all audio files, provide a meaningful analysis even without transcription
                message += "\n\nThis audio file contains sound data that could not be automatically transcribed. "
                message += "The audio may contain speech, music, or other audio content. "
                message += "Due to technical limitations, the specific content could not be converted to text."
                
                return {
                    "text": message,
                    "segments": [],
                    "metadata": {
                        "file_path": audio_path,
                        "status": "file_info_only",
                        "error": "Could not transcribe this audio format",
                        "file_info": {
                            "file_size_mb": round(file_size, 2),
                            "file_extension": file_extension
                        }
                    }
                }
        except Exception as e:
            print(f"Error getting basic audio info: {str(e)}")
            import traceback
            traceback.print_exc()
        
        # If absolutely all methods failed, return a useful general description
        file_name = os.path.basename(audio_path)
        return {
            "text": f"[Audio file detected: {file_name}] This audio file was successfully uploaded but could not be transcribed. The system can process this file for general audio analysis without requiring a detailed transcription.",
            "segments": [],
            "metadata": {
                "file_path": audio_path,
                "status": "basic_detection_only",
                "message": "Audio file detected, no transcription available",
                "file_name": file_name
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
        
        # If transcription completely failed (no text at all), return early
        if not transcription.get('text'):
            return {
                "audio_processing_result": {
                    "error": "Failed to detect audio or file is corrupted",
                    "metadata": metadata
                },
                "file_type": "audio",
                "mime_type": mimetypes.guess_type(file_path)[0] or "audio/mpeg"
            }
            
        # If we have basic detection but no real transcription, provide an informative response
        if transcription.get('metadata', {}).get('status') in ['basic_info_only', 'file_info_only', 'basic_detection_only']:
            return {
                "audio_processing_result": {
                    "transcription": transcription,
                    "analysis": {
                        "description": "Audio file detected",
                        "content_type": "audio",
                        "note": "Automatic transcription not available for this file. Processing continued with basic audio information.",
                        "recommendations": [
                            "The audio content can still be processed for general analysis.",
                            "You can provide any details about the audio in a text note if needed."
                        ]
                    },
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
