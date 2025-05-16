"""
Master Agent for orchestrating the processing of different types of files.
This module provides a high-level interface for the frontend to interact with.
"""
import os
import json
import asyncio
from typing import Dict, Any, Optional, List, Union
from datetime import datetime
import time

from langchain.smith import RunEvalConfig
from langchain.callbacks.tracers.langchain import LangChainTracer
import langsmith

from .langsmith_integration import setup_langsmith, track_agent_performance
from .tools import get_processor
from .document_graph import DocumentGraph

class MasterAgent:
    """
    Master Agent that coordinates and orchestrates the processing of different file types
    and provides a unified interface for the frontend.
    """
    
    def __init__(self):
        """Initialize the master agent"""
        self.langsmith_client = setup_langsmith()
        self.document_graph = DocumentGraph()
        
        # Initialize the list of available tools/processors
        self.tools = [
            {"name": "TextProcessor", "description": "Process text files and extract structured information", "file_type": "text"},
            {"name": "ImageProcessor", "description": "Process image files with OCR and vision analysis", "file_type": "image"},
            {"name": "AudioProcessor", "description": "Process audio files with transcription and analysis", "file_type": "audio"},
            {"name": "VideoProcessor", "description": "Process video files with transcription and analysis", "file_type": "video"},
        ]
    
    def get_available_processors(self) -> List[Dict[str, str]]:
        """
        Get a list of available processors/tools
        
        Returns:
            List of dictionaries with processor information
        """
        return self.tools
    
    async def run(self, 
                query: Optional[str] = None, 
                direct_file_path: Optional[str] = None,
                file_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Run the master agent with a query or direct file processing
        
        Args:
            query: Optional natural language query to process
            direct_file_path: Optional direct path to a file to process
            file_type: Optional type of the file to process (required if direct_file_path is provided)
            
        Returns:
            Dict with processing results
        """
        # Start timing
        start_time = time.time()
        
        # Process direct file if provided
        if direct_file_path and file_type:
            try:
                # Process the file using the document graph (with await)
                result = await self.document_graph.run(
                    inputs={},
                    direct_file_path=direct_file_path,
                    file_type=file_type,
                    instructions=query  # Use the query as instructions if provided
                )
                
                # Add processing time
                processing_time = time.time() - start_time
                result['processing_time'] = f"{processing_time:.2f} seconds"
                
                # Add timestamp and run metadata
                result['timestamp'] = datetime.now().isoformat()
                result['query'] = query
                
                return result
            except Exception as e:
                # Return error result
                return {
                    "status": "error",
                    "error": str(e),
                    "query": query,
                    "file_path": direct_file_path,
                    "file_type": file_type,
                    "processing_time": f"{time.time() - start_time:.2f} seconds",
                    "timestamp": datetime.now().isoformat()
                }
        
        # If no direct file, process the query
        elif query:
            # In a more complex implementation, this would route the query to the appropriate processor
            # or use a router LLM to decide how to handle the query
            return {
                "status": "error",
                "error": "Direct query processing without a file is not yet supported. Please provide a file to process.",
                "query": query,
                "processing_time": f"{time.time() - start_time:.2f} seconds",
                "timestamp": datetime.now().isoformat()
            }
            
        # No inputs provided
        else:
            return {
                "status": "error",
                "error": "No query or file provided for processing",
                "timestamp": datetime.now().isoformat()
            }
            
    def agent_info(self) -> Dict[str, Any]:
        """
        Get information about the master agent and its capabilities
        
        Returns:
            Dict with agent information
        """
        return {
            "name": "MasterAgent",
            "description": "Orchestrates the processing of different file types",
            "version": "1.0.0",
            "capabilities": [
                "Text document processing",
                "Image processing with OCR",
                "Audio transcription and analysis",
                "Video processing"
            ],
            "available_processors": self.get_available_processors(),
            "langsmith_enabled": self.langsmith_client is not None
        }
