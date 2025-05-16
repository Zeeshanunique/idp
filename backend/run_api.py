#!/usr/bin/env python
import uvicorn
import os
from pathlib import Path
from dotenv import load_dotenv

def main():
    """
    Start the FastAPI server
    """
    # Load environment variables from .env file
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    
    # Get the port from environment or default to 8000
    port = int(os.environ.get("PORT", 8000))
    
    # Create any necessary directories
    uploads_dir = Path(__file__).parent / "uploads"
    uploads_dir.mkdir(exist_ok=True)
    
    for folder in ["text", "image", "video", "audio", "processed"]:
        (uploads_dir / folder).mkdir(exist_ok=True)
    
    # Start the uvicorn server
    print(f"Starting Document Intelligence API server at http://localhost:{port}")
    uvicorn.run(
        "demo_crew.api.main:app", 
        host="0.0.0.0", 
        port=port,
        reload=True,  # Enable auto-reload during development
        log_level="info"
    )

if __name__ == "__main__":
    main()