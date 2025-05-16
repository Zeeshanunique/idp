"""
Document Graph for orchestrating the processing of different types of files.
This module coordinates the various processors and tools.
"""
import os
import json
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
import time

# Import LangSmith integration with error handling
from .langsmith_integration import setup_langsmith, track_agent_performance

# Wrap other LangChain imports in try/except to handle missing dependencies
try:
    from langchain.smith import RunEvalConfig
    from langchain.callbacks.tracers.langchain import LangChainTracer
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("LangChain tracing is not available - some dependencies may be missing.")

# Import tools
from .tools import get_processor

class DocumentGraph:
    """
    Graph-based document processing orchestrator that coordinates 
    the processing of different file types using specialized processors.
    """
    
    def __init__(self):
        """Initialize the document graph"""
        # Set up LangSmith for tracing if available
        self.langsmith_client = setup_langsmith() if LANGCHAIN_AVAILABLE else None
        
    async def process_file(self, 
                          file_path: str, 
                          file_type: str, 
                          instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a file using the appropriate processor based on file type
        
        Args:
            file_path: Path to the file to process
            file_type: Type of file (text, image, audio, video)
            instructions: Optional instructions for processing
            
        Returns:
            Dict with processing results
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        # Get the appropriate processor for the file type
        try:
            processor = get_processor(file_type)
        except ValueError as e:
            return {
                "status": "error",
                "error": str(e),
                "file_path": file_path,
                "file_type": file_type
            }
        except ImportError as e:
            return {
                "status": "error",
                "error": f"Missing dependency for {file_type} processor: {str(e)}",
                "file_path": file_path,
                "file_type": file_type
            }
            
        # Process the file
        try:
            # Check if processor has the run_with_tracing method
            if hasattr(processor, 'run_with_tracing'):
                result = await processor.run_with_tracing(file_path, instructions)
            else:
                # Fallback to regular process method if run_with_tracing is not available
                result = await processor.process(file_path, instructions)
                # Format the result in the standard format
                result = {
                    "status": "completed",
                    f"{file_type}_processing_result": result,
                    "file_path": file_path,
                    "file_type": file_type
                }
            return result
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            print(f"Error processing file: {str(e)}\n{error_traceback}")
            return {
                "status": "error",
                "error": str(e),
                "traceback": error_traceback,
                "file_path": file_path,
                "file_type": file_type
            }
    
    async def run(self, 
                 inputs: Dict[str, Any] = None, 
                 direct_file_path: Optional[str] = None,
                 file_type: Optional[str] = None,
                 instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Run the document processing workflow asynchronously
        
        Args:
            inputs: Dictionary of inputs for the workflow (optional)
            direct_file_path: Optional direct path to a file to process
            file_type: Optional type of the file to process
            instructions: Optional instructions for processing
            
        Returns:
            Dict with results from all processing steps
        """
        # Start timing
        start_time = time.time()
        
        # Process direct file if provided
        if direct_file_path and file_type:
            try:
                # Process the file directly with await - no need for manual event loop management
                result = await self.process_file(direct_file_path, file_type, instructions)
                
                # Add processing time
                processing_time = time.time() - start_time
                result['processing_time'] = f"{processing_time:.2f} seconds"
                
                # Add timestamp
                result['timestamp'] = datetime.now().isoformat()
                
                # If this was successful and LangSmith is available, track it
                if LANGCHAIN_AVAILABLE and self.langsmith_client and result.get('status') == 'completed':
                    # Extract metrics for tracking
                    metrics = {
                        'processing_time': processing_time,
                        'file_type': file_type,
                        'success': True,
                    }
                    
                    # If there's a run_id in the result, track metrics
                    run_id = result.get('run_id')
                    if run_id:
                        track_agent_performance(
                            self.langsmith_client,
                            run_id,
                            file_type,
                            metrics
                        )
                
                return result
            except Exception as e:
                import traceback
                error_traceback = traceback.format_exc()
                print(f"Error in document graph run: {str(e)}\n{error_traceback}")
                # Return error result
                return {
                    f"{file_type}_processing_result": f"Error: {str(e)}",
                    "status": "error",
                    "error": str(e),
                    "traceback": error_traceback,
                    "processing_time": f"{time.time() - start_time:.2f} seconds",
                    "timestamp": datetime.now().isoformat()
                }
        
        # If no direct file, process files from inputs if provided
        elif inputs:
            results = {}
            # For now, just return a placeholder since batch processing isn't implemented
            return {
                "status": "error",
                "error": "Batch processing is not yet implemented. Please provide a direct file path.",
                "timestamp": datetime.now().isoformat()
            }
            
        # No inputs provided
        else:
            return {
                "status": "error",
                "error": "No file or inputs provided for processing",
                "timestamp": datetime.now().isoformat()
            }
