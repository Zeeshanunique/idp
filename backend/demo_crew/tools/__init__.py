"""
Tools module for processing different types of files.
This module gracefully handles missing dependencies.
"""
from typing import Dict, Any, Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize empty mapping
TOOL_MAPPING = {}

# Import specific tool classes with error handling
try:
    from .text_tools import TextProcessor
    TOOL_MAPPING["text"] = TextProcessor
    logger.info("TextProcessor loaded successfully")
except ImportError as e:
    logger.warning(f"Failed to load TextProcessor: {str(e)}")
    
try:
    from .image_tools import ImageProcessor
    TOOL_MAPPING["image"] = ImageProcessor
    logger.info("ImageProcessor loaded successfully")
except ImportError as e:
    logger.warning(f"Failed to load ImageProcessor: {str(e)}")
    
try:
    from .audio_tools import AudioProcessor
    TOOL_MAPPING["audio"] = AudioProcessor
    logger.info("AudioProcessor loaded successfully")
except ImportError as e:
    logger.warning(f"Failed to load AudioProcessor: {str(e)}")
    
try:
    from .video_tools import VideoProcessor
    TOOL_MAPPING["video"] = VideoProcessor
    logger.info("VideoProcessor loaded successfully")
except ImportError as e:
    logger.warning(f"Failed to load VideoProcessor: {str(e)}")

def get_processor(file_type: str):
    """
    Get a processor instance for the specified file type
    
    Args:
        file_type: Type of file (text, image, audio, video)
        
    Returns:
        Processor instance appropriate for the file type
        
    Raises:
        ValueError: If file_type is not supported
        ImportError: If the processor dependencies are missing
    """
    # Check if we have any processors loaded
    if not TOOL_MAPPING:
        raise ImportError("No processors could be loaded due to missing dependencies. Please check your installation.")
        
    # Check if the requested processor type is available
    if file_type not in TOOL_MAPPING:
        raise ValueError(f"Unsupported file type: {file_type}. Supported types: {list(TOOL_MAPPING.keys())}")
    
    # Get and instantiate the processor    
    processor_class = TOOL_MAPPING[file_type]
    
    try:
        return processor_class()
    except Exception as e:
        logger.error(f"Error instantiating {file_type} processor: {str(e)}")
        raise ImportError(f"Could not initialize {file_type} processor due to: {str(e)}")
