"""
Image processor for handling image files with OCR and analysis capabilities.
"""
import os
import json
import asyncio
from typing import Dict, Any, Optional, List
import mimetypes
import tempfile
from io import BytesIO
import base64

try:
    from PIL import Image
    import numpy as np
    from paddleocr import PaddleOCR
except ImportError:
    # Fallback to basic functionality if dependencies aren't available
    pass

# Import the utility module for LangChain compatibility
from .langchain_utils import (
    get_llm, 
    create_prompt, 
    run_vision_model, 
    HumanMessage,  # For vision model
    LANGCHAIN_AVAILABLE
)

from .base_processor import BaseProcessor

class ImageProcessor(BaseProcessor):
    """Processor for image-based documents with OCR capabilities"""
    
    def __init__(self):
        """Initialize the image processor"""
        super().__init__()
        self.name = "ImageProcessor"
        
        # Initialize the language model using our utility function
        self.llm = get_llm(
            model_name="gpt-4o",
            temperature=0.2,
            max_tokens=1500
        )
        
        # Set up OCR engine (lazy initialization)
        self._ocr_engine = None
        
        # Set up templates
        self.system_template = """You are an OCR Image Analyst, an AI trained to extract structured information from images.
        
Your task is to analyze the provided image and extract all text content, organizing it into a clean, structured JSON format.

Follow these guidelines:
1. Extract all visible text from the image
2. Identify key entities, facts, and data points
3. Organize the information into logical categories
4. Structure the output as a valid JSON object
5. For forms or documents, identify field labels and their values
6. Recognize tables and their structure when present
7. Identify and preserve hierarchical relationships within the text
8. Include spatial information about text placement when relevant
9. For diagrams or charts, describe their content and purpose
10. Note any quality issues that affect OCR reliability

{instructions}
"""
        
    @property
    def ocr_engine(self):
        """Lazy initialization of OCR engine"""
        if self._ocr_engine is None:
            try:
                self._ocr_engine = PaddleOCR(use_angle_cls=True, lang='en')
            except Exception as e:
                print(f"Warning: Failed to initialize PaddleOCR: {str(e)}")
                self._ocr_engine = None
        return self._ocr_engine
        
    async def _run_ocr(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Run OCR on an image file using PaddleOCR
        
        Args:
            image_path: Path to the image file
            
        Returns:
            List of OCR results with text and positions
        """
        if not self.ocr_engine:
            return []
            
        try:
            # Run OCR (wrap in asyncio.to_thread for async execution)
            ocr_result = await asyncio.to_thread(self.ocr_engine.ocr, image_path, cls=True)
            
            # Process results
            extracted_data = []
            if ocr_result and len(ocr_result) > 0:
                for idx, res in enumerate(ocr_result):
                    if res:
                        for line in res:
                            position = line[0]  # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                            text = line[1][0]   # Extracted text
                            confidence = line[1][1]  # Confidence score
                            
                            extracted_data.append({
                                "text": text,
                                "position": position,
                                "confidence": float(confidence)
                            })
            
            return extracted_data
        except Exception as e:
            print(f"OCR error: {str(e)}")
            return []
    
    def _encode_image(self, image_path: str) -> str:
        """
        Encode image as base64 for API calls
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Base64-encoded image data
        """
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
        return encoded_string
        
    async def process(self, file_path: str, instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Process an image file and extract text and structured information
        
        Args:
            file_path: Path to the image file
            instructions: Optional specific instructions for processing
            
        Returns:
            Dict with processing results
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Get file metadata
        metadata = self._get_file_metadata(file_path)
        
        # Custom instructions handling
        instruction_text = ""
        if instructions:
            instruction_text = f"Additional instructions: {instructions}"
        
        # Run OCR on the image
        ocr_results = await self._run_ocr(file_path)
        
        # Set up the vision model prompt with the image
        encoded_image = self._encode_image(file_path)
        image_url = f"data:image/jpeg;base64,{encoded_image}"
        
        # Create the vision prompt
        content = [
            {
                "type": "text",
                "text": f"Analyze this image and extract all text content, organizing it into structured data. {instruction_text}"
            },
            {
                "type": "image_url",
                "image_url": {"url": image_url}
            }
        ]
        
        # Process the image using our vision model utility
        text_prompt = f"Analyze this image and extract all text content, organizing it into structured data. {instruction_text}"
        image_url = f"data:image/jpeg;base64,{encoded_image}"
        
        result_dict = await run_vision_model(self.llm, text_prompt, image_url)
        
        # Create a compatible result object
        if result_dict.get("success", False):
            result_content = result_dict.get("content", "")
        else:
            error_msg = result_dict.get("error", "Unknown error")
            result_content = f"Error processing image from {file_path}: {error_msg}"
        
        # Extract structured data from the result
        analysis = result_content
        
        # Try to parse as JSON if it looks like JSON
        structured_data = {}
        try:
            # Check if the result contains a JSON object
            if "{" in analysis and "}" in analysis:
                # Try to extract JSON from the text
                json_start = analysis.find("{")
                json_end = analysis.rfind("}") + 1
                json_str = analysis[json_start:json_end]
                
                structured_data = json.loads(json_str)
            else:
                # If not JSON, keep as text
                structured_data = {"extracted_text": analysis}
        except json.JSONDecodeError:
            # If JSON parsing fails, keep as text
            structured_data = {"extracted_text": analysis}
        
        # Combine OCR and vision analysis results
        result = {
            "ocr_results": ocr_results,
            "vision_analysis": structured_data,
            "metadata": metadata
        }
        
        return {
            "image_processing_result": result,
            "file_type": "image",
            "mime_type": mimetypes.guess_type(file_path)[0] or "image/jpeg"
        }

    async def run_with_tracing(self, file_path: str, instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Process an image file with tracing if available, falls back to regular processing if not
        
        Args:
            file_path: Path to the image file
            instructions: Optional specific instructions for processing
            
        Returns:
            Dict with processing results structured for the API response
        """
        try:
            # Get result from process method
            result = await self.process(file_path, instructions)
            
            # Format for API response
            return {
                "status": "completed",
                "image_processing_result": result.get("image_processing_result", {}),
                "ocr_results": result.get("ocr_results", []),
                "file_path": file_path,
                "file_type": "image",
                "instructions": instructions
            }
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            print(f"Error in run_with_tracing for ImageProcessor: {str(e)}\n{error_traceback}")
            
            return {
                "status": "error",
                "error": str(e),
                "traceback": error_traceback,
                "file_path": file_path,
                "file_type": "image"
            }
