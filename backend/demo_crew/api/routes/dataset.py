"""
Dataset routes for accessing and manipulating processed data.
"""
from fastapi import APIRouter, HTTPException
import os
import json
from typing import Dict, Any, List, Optional

# Create router
router = APIRouter(tags=["Dataset"])

def ensure_dataset_file() -> str:
    """
    Ensure the simplified dataset file exists and return its path
    
    Returns:
        Path to the simplified dataset file
    """
    # Get the backend directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    dataset_path = os.path.join(backend_dir, "simplified_dataset.json")
    
    # Create empty dataset if it doesn't exist
    if not os.path.exists(dataset_path):
        empty_dataset = {"results": []}
        with open(dataset_path, "w") as f:
            json.dump(empty_dataset, f, indent=2)
    
    return dataset_path

@router.get("/")
async def get_dataset() -> Dict[str, Any]:
    """
    Get the complete simplified dataset
    
    Returns:
        Dataset as a JSON object
    """
    dataset_path = ensure_dataset_file()
    
    try:
        with open(dataset_path, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error reading dataset: {str(e)}"
        )

@router.get("/latest")
async def get_latest_result() -> Dict[str, Any]:
    """
    Get only the latest result from the dataset
    
    Returns:
        Latest result as a JSON object
    """
    dataset_path = ensure_dataset_file()
    
    try:
        with open(dataset_path, "r") as f:
            data = json.load(f)
            
        results = data.get("results", [])
        if not results:
            return {"result": None, "message": "No results available"}
            
        # Return the last result
        return {"result": results[-1]}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error reading latest result: {str(e)}"
        )

@router.get("/by-type/{agent_type}")
async def get_results_by_type(agent_type: str) -> Dict[str, Any]:
    """
    Get all results from a specific agent type
    
    Args:
        agent_type: Type of agent (text, image, audio, video)
        
    Returns:
        Filtered results as a JSON object
    """
    dataset_path = ensure_dataset_file()
    
    try:
        with open(dataset_path, "r") as f:
            data = json.load(f)
            
        # Filter results by agent type
        filtered_results = [
            result for result in data.get("results", [])
            if result.get("agent_type") == agent_type
        ]
        
        return {"results": filtered_results, "agent_type": agent_type}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error filtering results: {str(e)}"
        )
