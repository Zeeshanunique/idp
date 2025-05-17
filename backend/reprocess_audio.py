"""
Script to reprocess audio files with the improved transcription code.
Uses OpenAI API directly for more accurate transcription.
"""
import asyncio
import os
import json
import glob
from openai import OpenAI

async def reprocess_audio_files():
    """Reprocess audio files in the uploads directory directly with OpenAI."""
    audio_dir = "/workspaces/idp/backend/uploads/audio"
    processed_dir = "/workspaces/idp/backend/uploads/processed"
    
    # Check if directory exists
    if not os.path.exists(audio_dir):
        print(f"Audio directory {audio_dir} does not exist!")
        return
        
    # Create processed directory if it doesn't exist
    os.makedirs(processed_dir, exist_ok=True)
    
    # Check for OpenAI API key
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable is not set.")
        print("Please set it before running this script.")
        return
        
    # Print API key information (safely)
    masked_key = api_key[:8] + "..." + api_key[-4:]
    print(f"Using OpenAI API key: {masked_key}")
    
    # Check if it's a project-based key
    if api_key.startswith("sk-proj-"):
        print("Warning: Using a project-scoped API key (sk-proj-). These keys have limitations.")
        print("Audio transcription might fail with project-scoped keys.")
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    # Get list of audio files (support more formats)
    audio_files = []
    for ext in ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac']:
        audio_files.extend([f for f in os.listdir(audio_dir) if f.endswith(ext)])
    
    print(f"Found {len(audio_files)} audio files to process")
    
    for audio_file in audio_files:
        audio_path = os.path.join(audio_dir, audio_file)
        output_path = os.path.join(processed_dir, f"{audio_file}.json")
        
        print(f"\n\nProcessing {audio_file}...")
        
        try:
            # Try different models in sequence
            models = ["gpt-4o-transcribe", "gpt-4o-mini-transcribe", "whisper-1"]
            result = None
            last_error = None
            
            for model in models:
                try:
                    print(f"Attempting transcription with {model}...")
                    with open(audio_path, "rb") as file:
                        if model == "whisper-1":
                            # Whisper supports verbose JSON output
                            response = client.audio.transcriptions.create(
                                model=model,
                                file=file, 
                                response_format="verbose_json"
                            )
                            
                            # For whisper, we can get segments too
                            segments = []
                            if hasattr(response, 'segments'):
                                for segment in response.segments:
                                    segments.append({
                                        "start": segment.get("start", 0),
                                        "end": segment.get("end", 0),
                                        "text": segment.get("text", "")
                                    })
                            
                            text = response.text if hasattr(response, 'text') else str(response)
                            
                        else:
                            # GPT-4o models only support text format
                            response = client.audio.transcriptions.create(
                                model=model,
                                file=file, 
                                response_format="text"
                            )
                            text = response if isinstance(response, str) else str(response)
                            segments = []
                    
                    # If we get here, transcription was successful
                    print(f"Successfully transcribed with {model}!")
                    if text:
                        print(f"Text (first 100 chars): {text[:100]}...")
                        
                        # Format result to match API output structure
                        file_metadata = {
                            "file_name": audio_file,
                            "file_extension": os.path.splitext(audio_file)[1],
                            "file_size": os.path.getsize(audio_path),
                            "last_modified": os.path.getmtime(audio_path),
                            "file_path": audio_path
                        }
                        
                        result = {
                            "results": [
                                {
                                    "output": {
                                        "transcription": {
                                            "text": text,
                                            "segments": segments,
                                            "metadata": {
                                                "file_path": audio_path,
                                                "status": "completed",
                                                "model": model
                                            }
                                        },
                                        "analysis": {
                                            "description": "Audio transcribed successfully", 
                                            "content_type": "audio",
                                            "note": f"Transcribed using OpenAI {model}."
                                        },
                                        "metadata": file_metadata
                                    },
                                    "agent_type": "audio"
                                }
                            ]
                        }
                        
                        # Break out of the loop since we succeeded
                        break
                except Exception as e:
                    last_error = str(e)
                    print(f"Error with {model}: {last_error}")
                    
                    if "project-based" in last_error.lower() or "project" in last_error.lower():
                        print("This appears to be due to using a project-scoped API key.")
                        break
            
            # If we still don't have a result, create one with the error
            if not result:
                # Create a result with error info and basic audio metadata
                import wave
                
                try:
                    # Try to get audio info for WAV files
                    with wave.open(audio_path, 'rb') as wav_file:
                        channels = wav_file.getnchannels()
                        sample_width = wav_file.getsampwidth()
                        framerate = wav_file.getframerate()
                        frames = wav_file.getnframes()
                        duration = frames / float(framerate)
                        
                        audio_info = {
                            "channels": channels,
                            "sample_width": sample_width, 
                            "framerate": framerate,
                            "duration": duration
                        }
                except:
                    audio_info = {"error": "Could not read audio file properties"}
                
                result = {
                    "results": [
                        {
                            "output": {
                                "transcription": {
                                    "text": f"[Audio file detected: {audio_file}. Duration: {audio_info.get('duration', 'unknown')} seconds. Audio format: {audio_info.get('channels', 'unknown')} channel(s), {audio_info.get('framerate', 'unknown')} Hz sample rate.]",
                                    "segments": [],
                                    "metadata": {
                                        "file_path": audio_path,
                                        "status": "basic_info_only",
                                        "error": f"Transcription unavailable - falling back to basic audio info. Error: {last_error}",
                                        "audio_info": audio_info
                                    }
                                },
                                "analysis": {
                                    "description": "Audio file detected",
                                    "content_type": "audio", 
                                    "note": "Automatic transcription not available for this file. Processing continued with basic audio information.",
                                    "recommendations": [
                                        "The audio content can still be processed for general analysis.",
                                        "You can provide any details about the audio in a text note if needed."
                                    ]
                                },
                                "metadata": {
                                    "file_name": audio_file,
                                    "file_extension": os.path.splitext(audio_file)[1],
                                    "file_size": os.path.getsize(audio_path),
                                    "last_modified": os.path.getmtime(audio_path),
                                    "file_path": audio_path
                                }
                            },
                            "agent_type": "audio"
                        }
                    ]
                }
                
            # Save the result
            with open(output_path, "w") as f:
                json.dump(result, f, indent=2)
            print(f"Results saved to: {output_path}")
                
        except Exception as e:
            print(f"Error processing {audio_file}: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(reprocess_audio_files())
