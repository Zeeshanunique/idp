from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from typing import Optional, List
import os
import uuid
import time
import shutil
import json
import sys
import asyncio
from dotenv import load_dotenv

# Add parent directory to path to ensure imports work
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from demo_crew.master_agent import MasterAgent
from demo_crew.langsmith_integration import setup_langsmith

# Create router
router = APIRouter(tags=["Upload"])

# Create uploads directory structure if it doesn't exist
def ensure_upload_dirs():
    base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "uploads")
    for folder in ["text", "image", "video", "audio", "processed"]:
        os.makedirs(os.path.join(base_dir, folder), exist_ok=True)
    return base_dir

# Function to process files in the background 
async def process_file(file_path: str, file_type: str, instructions: Optional[str] = None):
    """
    Process a file based on its type using the appropriate AI agent.
    """
    start_time = time.time()
    
    try:
        # Verify that the file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at path: {file_path}")
        
        # Load environment variables for API keys
        dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".env")
        load_dotenv(dotenv_path)
        
        # Log processing start
        print(f"Processing {file_type} file at {file_path}")
        
        # Initialize and use the Master Agent for file processing
        master_agent = MasterAgent()
        
        # Process the file using the master agent with direct file path
        # Since this is running in a background task, we can use await directly
        processing_result = await master_agent.run(
            query=instructions,  # Pass instructions as the query
            direct_file_path=file_path,
            file_type=file_type
        )
        
        # Log success
        print(f"Successfully processed file {file_path}, result keys: {processing_result.keys() if processing_result else 'None'}")
        
        # Extract the relevant result based on file type
        output_key = f"{file_type}_processing_result"
        output = processing_result.get(output_key, "No output generated")
        
        # Calculate processing time
        processing_time = processing_result.get('processing_time', f"{time.time() - start_time:.2f} seconds")
        
        # Create result format
        result = {
            "status": "completed",
            "file_type": file_type,
            "original_file": os.path.basename(file_path),
            "processing_time": processing_time,
            "instructions": instructions if instructions else "No specific instructions provided",
            "extracted_data": {
                "output": output,
                "agent_type": file_type,
                "timestamp": processing_result.get('timestamp', time.time()),
                "processed_file": file_path
            }
        }
        
        # Save result to a JSON file
        result_filename = f"{os.path.splitext(os.path.basename(file_path))[0]}_result.json"
        processed_dir = os.path.join(os.path.dirname(os.path.dirname(file_path)), "processed")
        result_path = os.path.join(processed_dir, result_filename)
        
        with open(result_path, "w") as f:
            json.dump(result, f, indent=2)
        
        # Create simplified dataset
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        combined_dataset_path = os.path.join(backend_dir, "simplified_dataset.json")
        
        # Create new dataset with the current result (replacing any previous data)
        new_dataset = {
            "results": [
                {
                    "output": output,
                    "agent_type": file_type
                }
            ]
        }
        
        # Save the dataset
        with open(combined_dataset_path, "w") as f:
            json.dump(new_dataset, f, indent=2)
        
        # Copy to the demo_crew directory
        demo_crew_dir = os.path.join(backend_dir, "demo_crew")
        demo_crew_output_path = os.path.join(demo_crew_dir, "processed_data.json")
        
        # Ensure demo_crew directory exists
        os.makedirs(os.path.dirname(demo_crew_output_path), exist_ok=True)
        
        with open(demo_crew_output_path, "w") as f:
            json.dump(new_dataset, f, indent=2)
        
        return result_path
    
    except Exception as e:
        import traceback
        # Handle any exceptions during processing
        error_message = str(e)
        error_traceback = traceback.format_exc()
        print(f"Error processing file: {error_message}\n{error_traceback}")
        
        result = {
            "status": "failed",
            "file_type": file_type,
            "original_file": os.path.basename(file_path),
            "processing_time": f"{time.time() - start_time:.2f} seconds",
            "error": error_message,
            "traceback": error_traceback,
            "instructions": instructions if instructions else "No specific instructions provided",
        }
    
        # Save result to a JSON file
        result_filename = f"{os.path.splitext(os.path.basename(file_path))[0]}_result.json"
        processed_dir = os.path.join(os.path.dirname(os.path.dirname(file_path)), "processed")
        result_path = os.path.join(processed_dir, result_filename)
        
        with open(result_path, "w") as f:
            json.dump(result, f, indent=2)
        
        return result_path

@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    file_type: str = Form(...),
    instructions: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None)
):
    """
    Upload a file for processing by AI agents
    """
    base_dir = ensure_upload_dirs()
    
    # Validate file type
    if file_type not in ["text", "image", "video", "audio"]:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    try:
        # Generate a unique filename
        original_filename = file.filename
        file_extension = os.path.splitext(original_filename)[1] if original_filename else ""
        unique_id = str(uuid.uuid4())
        unique_filename = f"{unique_id}{file_extension}"
        
        # Save the file
        file_path = os.path.join(base_dir, file_type, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # For background tasks in FastAPI, we need a sync wrapper around async code
        def process_file_sync_wrapper():
            # Create a new event loop for this thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                # Run the async process_file in this new loop
                loop.run_until_complete(process_file(file_path, file_type, instructions))
            except Exception as e:
                print(f"Background processing error: {str(e)}")
                import traceback
                print(traceback.format_exc())
            finally:
                loop.close()
        
        # Add the synchronous wrapper to background tasks
        background_tasks.add_task(process_file_sync_wrapper)
        
        return {
            "status": "processing",
            "message": "File uploaded and being processed",
            "file_id": unique_id,  # Return just the UUID without extension
            "original_filename": original_filename,
            "file_type": file_type
        }
        
    except Exception as e:
        # Log the error
        print(f"Upload error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        # Return an appropriate error response
        raise HTTPException(status_code=500, detail=f"Error processing upload: {str(e)}")

@router.get("/status/{file_id}")
async def get_processing_status(file_id: str):
    """
    Check the status of a file being processed
    """
    # In a real implementation, this would check a database or queue
    # For demonstration, we'll check the processing result
    
    # Remove any file extension from the file_id in case it's present in the request
    file_id = file_id.split('.')[0] if '.' in file_id else file_id
    
    base_dir = ensure_upload_dirs()
    processed_dir = os.path.join(base_dir, "processed")
    
    # Check if result file exists (without extension)
    file_id_base = os.path.splitext(file_id)[0]
    result_files = [f for f in os.listdir(processed_dir) if f.startswith(file_id_base)]
    
    if result_files:
        # Find the simplified dataset file
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        simplified_dataset_path = os.path.join(backend_dir, "simplified_dataset.json")
        
        # If simplified dataset exists, use it instead of the full result
        if os.path.exists(simplified_dataset_path):
            try:
                with open(simplified_dataset_path, "r") as f:
                    simplified_data = json.load(f)
                
                # Return only the simplified data
                return {
                    "status": "completed",
                    "result": simplified_data,
                    "result_file": "/simplified_dataset.json"
                }
            except Exception as e:
                print(f"Error reading simplified dataset: {str(e)}")
        
        # Fallback to original result file if simplified dataset doesn't exist
        result_file = result_files[0]
        result_path = os.path.join(processed_dir, result_file)
        
        with open(result_path, "r") as f:
            result_data = json.load(f)
        
        return {
            "status": "completed",
            "result": result_data,
            "result_file": f"/uploads/processed/{result_file}"
        }
    
    return {
        "status": "processing",
        "message": "File is still being processed"
    }

@router.get("/dataset")
async def get_simplified_dataset():
    """
    Get the simplified dataset containing only output and agent_type fields
    """
    # Look for the simplified dataset in multiple locations
    possible_paths = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "simplified_dataset.json"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "processed_data.json"),
    ]
    
    dataset = {"results": []}
    
    # Try each path until we find the dataset
    for path in possible_paths:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    dataset = json.load(f)
                break
            except Exception as e:
                print(f"Error reading {path}: {str(e)}")
    
    # Return only the output and agent_type fields for each result
    return dataset