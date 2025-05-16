#!/usr/bin/env python
import os
from pathlib import Path
from typing import Dict, Any, Optional
from dotenv import load_dotenv

def load_environment():
    """
    Load environment variables from .env file
    """
    # Try to load from the backend directory first
    backend_env = Path(__file__).parent.parent / ".env"
    if backend_env.exists():
        load_dotenv(backend_env)
        return True
    
    # Try parent directories
    parent_env = Path(__file__).parent.parent.parent / ".env"
    if parent_env.exists():
        load_dotenv(parent_env)
        return True
    
    return False

def ensure_upload_directories():
    """
    Create upload directories if they don't exist
    """
    # Get uploads path from environment or use default
    uploads_path = os.environ.get("UPLOAD_PATH", "./uploads")
    
    # Convert relative path to absolute if needed
    if not os.path.isabs(uploads_path):
        uploads_path = os.path.join(Path(__file__).parent.parent, uploads_path)
    
    # Create the main uploads directory
    os.makedirs(uploads_path, exist_ok=True)
    
    # Create subdirectories for different file types
    for folder in ["text", "image", "video", "audio", "processed"]:
        os.makedirs(os.path.join(uploads_path, folder), exist_ok=True)
    
    return uploads_path

def process_file(file_path: str, file_type: str) -> Dict[str, Any]:
    """
    Simple file processing function that creates a result dictionary
    with basic metadata about the file.
    
    Args:
        file_path: Path to the file to process
        file_type: Type of the file (text, image, video, audio)
        
    Returns:
        Dictionary with processing results
    """
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}
    
    file_size = os.path.getsize(file_path)
    file_name = os.path.basename(file_path)
    
    return {
        "file_name": file_name,
        "file_type": file_type,
        "file_size": file_size,
        "file_path": file_path,
        "status": "processed"
    }

def run(file_path: Optional[str] = None, file_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Main function to run the processing pipeline
    
    Args:
        file_path: Optional path to a file to process
        file_type: Optional type of the file
        
    Returns:
        Processing results
    """
    # Load environment variables
    load_environment()
    
    # Ensure upload directories exist
    upload_dir = ensure_upload_directories()
    
    if file_path and file_type:
        return process_file(file_path, file_type)
    
    return {"status": "ready", "upload_dir": upload_dir}

# This is used when the module is run directly
if __name__ == "__main__":
    result = run()
    print(f"System status: {result['status']}")
    print(f"Upload directory: {result['upload_dir']}")

