from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
import json
import sys

# Add parent directory to path to ensure imports work
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from demo_crew.master_agent import MasterAgent
from .routes import upload, dataset

# Create FastAPI app
app = FastAPI(
    title="Document Intelligence API",
    description="API for processing documents, images, videos, and audio files with AI",
    version="1.0.0"
)

# Configure CORS to properly allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    max_age=86400  # 1 day in seconds
)

# Include routers
app.include_router(upload.router, prefix="/api")
app.include_router(dataset.router, prefix="/api/dataset")

# Mount static files (for serving uploaded/processed files)
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(uploads_dir, exist_ok=True)

# Ensure all subdirectories exist
for subdir in ["text", "image", "video", "audio", "processed"]:
    os.makedirs(os.path.join(uploads_dir, subdir), exist_ok=True)

# Mount uploads directory for serving static files
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/simplified_dataset.json")
async def get_simplified_dataset_file():
    """Serve the simplified dataset file directly"""
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    file_path = os.path.join(backend_dir, "simplified_dataset.json")
    
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            data = json.load(f)
        return data
    else:
        return {"error": "Dataset file not found", "results": []}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "Document Intelligence API"}

@app.get("/api/capabilities")
async def get_capabilities():
    """Get information about available processing capabilities"""
    try:
        # Initialize master agent
        master_agent = MasterAgent()
        
        # Get agent info
        agent_info = master_agent.agent_info()
        
        return agent_info
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "status": "error"
        }

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Document Intelligence API",
        "version": "1.0.0",
        "description": "API for processing documents, images, videos, and audio files with AI",
        "endpoints": [
            {"path": "/api/upload", "method": "POST", "description": "Upload files for processing"},
            {"path": "/api/status/{file_id}", "method": "GET", "description": "Check processing status"},
            {"path": "/api/dataset", "method": "GET", "description": "Get dataset contents"},
            {"path": "/api/capabilities", "method": "GET", "description": "Get processing capabilities"},
            {"path": "/api/health", "method": "GET", "description": "Health check"},
            {"path": "/simplified_dataset.json", "method": "GET", "description": "Get simplified dataset"},
        ]
    }