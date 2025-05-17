"""
Script to process a single audio file for transcription.
This targeted approach helps when only specific files need processing.
"""
import asyncio
import os
import json
import sys
from openai import OpenAI

async def process_single_audio_file(audio_filename):
    """Process a specific audio file with OpenAI API."""
    audio_dir = "/workspaces/idp/backend/uploads/audio"
    processed_dir = "/workspaces/idp/backend/uploads/processed"
    
    audio_path = os.path.join(audio_dir, audio_filename)
    output_path = os.path.join(processed_dir, f"{audio_filename}.json")
    
    # Check if file exists
    if not os.path.exists(audio_path):
        print(f"Error: File not found: {audio_path}")
        return False
        
    # Create processed directory if it doesn't exist
    os.makedirs(processed_dir, exist_ok=True)
    
    # Check for OpenAI API key
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable is not set.")
        print("Please set it before running this script.")
        return False
        
    # Print API key information (safely)
    masked_key = api_key[:8] + "..." + api_key[-4:]
    print(f"Using OpenAI API key: {masked_key}")
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    print(f"Processing {audio_filename}...")
    
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
                        "file_name": audio_filename,
                        "file_extension": os.path.splitext(audio_filename)[1],
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
                                "text": f"[Audio file detected: {audio_filename}. Duration: {audio_info.get('duration', 'unknown')} seconds. Audio format: {audio_info.get('channels', 'unknown')} channel(s), {audio_info.get('framerate', 'unknown')} Hz sample rate.]",
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
                                "file_name": audio_filename,
                                "file_extension": os.path.splitext(audio_filename)[1],
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
        return True
            
    except Exception as e:
        print(f"Error processing {audio_filename}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Get the file name from command line argument or use default
    if len(sys.argv) > 1:
        audio_filename = sys.argv[1]
    else:
        audio_filename = "77d43df6-d368-43b2-a37a-08d182b5c657.wav"  # Default file to process
        
    print(f"Will process audio file: {audio_filename}")
    asyncio.run(process_single_audio_file(audio_filename))
