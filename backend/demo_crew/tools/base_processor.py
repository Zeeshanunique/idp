"""
Base processor class for all file processing tools.
"""
import os
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
from langchain.callbacks.tracers.langchain import wait_for_all_tracers
from langchain.smith import RunEvalConfig
import time

class BaseProcessor(ABC):
    """Base class for all file processors"""
    
    def __init__(self):
        """Initialize the processor with common attributes"""
        self.name = self.__class__.__name__
        
    @abstractmethod
    async def process(self, file_path: str, instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Process the file at the given path
        
        Args:
            file_path: Path to the file to process
            instructions: Optional instructions for processing
            
        Returns:
            Dict with processing results
        """
        pass
    
    def _get_file_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Get basic metadata about a file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dict with file metadata
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        file_stats = os.stat(file_path)
        file_name = os.path.basename(file_path)
        file_ext = os.path.splitext(file_name)[1].lower()
        
        return {
            "file_name": file_name,
            "file_extension": file_ext,
            "file_size": file_stats.st_size,
            "last_modified": file_stats.st_mtime,
            "file_path": file_path
        }
    
    def _format_result(self, 
                      file_path: str, 
                      output: Dict[str, Any], 
                      processing_time: float, 
                      instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Format the processing result in a standardized way
        
        Args:
            file_path: Path to the processed file
            output: Processing output
            processing_time: Time taken to process the file
            instructions: Optional instructions used for processing
            
        Returns:
            Dict with standardized result format
        """
        file_name = os.path.basename(file_path)
        
        return {
            "status": "completed",
            "file_name": file_name,
            "file_path": file_path,
            "processing_time": f"{processing_time:.2f} seconds",
            "instructions": instructions if instructions else "No specific instructions provided",
            "extracted_data": output,
            "timestamp": time.time()
        }
        
    async def run_with_tracing(self, file_path: str, instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Run the processor with LangSmith tracing enabled
        
        Args:
            file_path: Path to the file to process
            instructions: Optional instructions for processing
            
        Returns:
            Dict with processing results
        """
        start_time = time.time()
        
        try:
            # Process the file
            result = await self.process(file_path, instructions)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Format the result
            formatted_result = self._format_result(
                file_path=file_path,
                output=result,
                processing_time=processing_time,
                instructions=instructions
            )
            
            # Wait for any tracers to finish
            wait_for_all_tracers()
            
            return formatted_result
        
        except Exception as e:
            # Handle any exceptions during processing
            processing_time = time.time() - start_time
            error_message = str(e)
            
            return {
                "status": "failed",
                "file_name": os.path.basename(file_path),
                "file_path": file_path,
                "processing_time": f"{processing_time:.2f} seconds",
                "error": error_message,
                "instructions": instructions if instructions else "No specific instructions provided"
            }
