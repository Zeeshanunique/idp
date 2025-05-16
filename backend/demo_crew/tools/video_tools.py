"""
Video processor for handling video files with transcription and analysis capabilities.
"""
import os
import json
import asyncio
import tempfile
from typing import Dict, Any, Optional, List
import mimetypes

try:
    import whisper
    from moviepy.editor import VideoFileClip
    import numpy as np
except ImportError:
    # Fallback to basic functionality if dependencies aren't available
    pass

# Import the utility module for LangChain compatibility
from .langchain_utils import (
    get_llm, 
    create_prompt, 
    run_llm_chain, 
    LANGCHAIN_AVAILABLE
)

from .base_processor import BaseProcessor

class VideoProcessor(BaseProcessor):
    """Processor for video files with transcription and analysis capabilities"""
    
    def __init__(self):
        """Initialize the video processor"""
        super().__init__()
        self.name = "VideoProcessor"
        
        # Initialize the language model using our utility function
        self.llm = get_llm(model_name="gpt-4-turbo", temperature=0.2)
        
        # Set up transcription engine (lazy initialization)
        self._transcription_model = None
        
        # Set up templates
        self.system_template = """You are a Video Transcriber & Analyzer, an AI trained to analyze video content and extract structured information.
        
Your task is to analyze the provided video transcript and transform it into a clean, structured JSON format.

Follow these guidelines:
1. Identify speakers if multiple people are talking
2. Organize content by topics, scenes, or segments
3. Include timestamps for key moments in the video
4. Extract key points, facts, and important information
5. Structure the output as a valid JSON object
6. Note any visual elements described in the transcript
7. Identify questions and answers if present
8. For interviews or dialogues, clearly separate different speakers
9. If there are unclear or [inaudible] sections, note them
10. Include any relevant metadata about the video content

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
        
    async def _extract_audio(self, video_path: str) -> str:
        """
        Extract audio from a video file
        
        Args:
            video_path: Path to the video file
            
        Returns:
            Path to the extracted audio file
        """
        try:
            # Create a temporary file for the audio
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_audio:
                temp_audio_path = temp_audio.name
                
            # Extract audio using moviepy
            await asyncio.to_thread(
                lambda: VideoFileClip(video_path).audio.write_audiofile(
                    temp_audio_path, 
                    codec='pcm_s16le', 
                    verbose=False, 
                    logger=None
                )
            )
            
            return temp_audio_path
        except Exception as e:
            print(f"Audio extraction error: {str(e)}")
            return ""
            
    async def _transcribe_video(self, video_path: str) -> Dict[str, Any]:
        """
        Extract audio and transcribe a video file using Whisper
        
        Args:
            video_path: Path to the video file
            
        Returns:
            Dict with transcription results
        """
        if not self.transcription_model:
            return {"text": "Transcription model not available", "segments": []}
            
        try:
            # Extract audio from video
            audio_path = await self._extract_audio(video_path)
            if not audio_path:
                return {"text": "Failed to extract audio from video", "segments": []}
                
            # Run transcription on the extracted audio
            result = await asyncio.to_thread(self.transcription_model.transcribe, audio_path)
            
            # Clean up the temporary audio file
            try:
                os.unlink(audio_path)
            except:
                pass
            
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
                "language": result.get('language', '')
            }
        except Exception as e:
            print(f"Video transcription error: {str(e)}")
            return {"text": f"Error: {str(e)}", "segments": []}
            
    async def _extract_video_metadata(self, video_path: str) -> Dict[str, Any]:
        """
        Extract metadata from a video file using moviepy
        
        Args:
            video_path: Path to the video file
            
        Returns:
            Dict with video metadata
        """
        try:
            # Extract metadata using moviepy
            clip = await asyncio.to_thread(VideoFileClip, video_path)
            
            metadata = {
                "duration": clip.duration,
                "fps": clip.fps,
                "size": clip.size,
                "rotation": getattr(clip, 'rotation', 0),
                "has_audio": clip.audio is not None
            }
            
            # Close the clip to release resources
            clip.close()
            
            return metadata
        except Exception as e:
            print(f"Video metadata extraction error: {str(e)}")
            return {}
        
    async def process(self, file_path: str, instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a video file and extract transcription and structured information
        
        Args:
            file_path: Path to the video file
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
        
        # Extract video-specific metadata
        video_metadata = await self._extract_video_metadata(file_path)
        metadata.update(video_metadata)
            
        # Transcribe the video
        transcription = await self._transcribe_video(file_path)
        
        # If transcription failed or is empty, return early
        if not transcription.get('text'):
            return {
                "video_processing_result": {
                    "error": "Failed to transcribe video or no speech detected",
                    "metadata": metadata
                },
                "file_type": "video",
                "mime_type": mimetypes.guess_type(file_path)[0] or "video/mp4"
            }
        
        # Create a proper prompt using our utility function
        prompt = create_prompt(
            system_template=self.system_template.format(instructions=instruction_text),
            human_template="Here is the video transcript to analyze and extract information from:\n\n{transcript}"
        )
        
        # Run the LLM chain using our utility function
        result_dict = await run_llm_chain(prompt, self.llm, {"transcript": transcription['text']})
        
        # Create a compatible result object
        if result_dict.get("success", False):
            result_content = result_dict.get("content", "")
        else:
            error_msg = result_dict.get("error", "Unknown error")
            result_content = f"Error processing video from {file_path}: {error_msg}"
        
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
            "video_processing_result": result,
            "file_type": "video",
            "mime_type": mimetypes.guess_type(file_path)[0] or "video/mp4"
        }
        
    async def run_with_tracing(self, file_path: str, instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a video file with tracing if available, falls back to regular processing if not
        
        Args:
            file_path: Path to the video file
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
                "video_processing_result": result.get("video_processing_result", {}),
                "file_path": file_path,
                "file_type": "video",
                "instructions": instructions
            }
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            print(f"Error in run_with_tracing for VideoProcessor: {str(e)}\n{error_traceback}")
            
            return {
                "status": "error",
                "error": str(e),
                "traceback": error_traceback,
                "file_path": file_path,
                "file_type": "video"
            }
