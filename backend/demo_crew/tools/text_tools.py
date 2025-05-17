"""
Text processor for handling text-based documents.
"""
import os
import json
import asyncio
from typing import Dict, Any, Optional, List
import mimetypes

# Import the utility module for LangChain compatibility
from .langchain_utils import (
    get_llm, 
    create_prompt, 
    run_llm_chain, 
    LANGCHAIN_AVAILABLE,
    ChatPrompTemplate
)

from .base_processor import BaseProcessor

# PDF processing
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("Warning: PyPDF2 is not available. PDF processing will be limited.")

class TextProcessor(BaseProcessor):
    """Processor for text-based documents"""
    
    def __init__(self):
        """Initialize the text processor"""
        super().__init__()
        self.name = "TextProcessor"
        
        # Initialize the language model using our utility function
        self.llm = get_llm(model_name="gpt-4-turbo", temperature=0.2)
        
        # Set up templates
        self.system_template = """You are a Text Data Specialist, an AI trained to extract structured information from text documents.
        
Your task is to analyze the provided text and transform it into a clean, structured JSON format.

Follow these guidelines:
1. Identify key entities, facts, and data points from the document
2. Organize the information into logical categories and hierarchies
3. Use consistent naming and formatting for all fields
4. Structure the output as a valid JSON object
5. Include all relevant information from the source text
6. If there are tables, organize them appropriately
7. Handle any lists and bullet points as arrays
8. Focus on factual content, not formatting elements
9. For ambiguous content, use the most reasonable interpretation
10. Include metadata about the document when available

{instructions}
"""
        
    async def process(self, file_path: str, instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a text file and extract structured information
        
        Args:
            file_path: Path to the text file
            instructions: Optional specific instructions for processing
            
        Returns:
            Dict with processing results
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Get file metadata
        metadata = self._get_file_metadata(file_path)
        file_ext = metadata["file_extension"]
        
        # Custom instructions handling
        instruction_text = ""
        if instructions:
            instruction_text = f"Additional instructions: {instructions}"
            
        # Read file content based on file type
        content = ""
        if file_ext.lower() == '.pdf':
            # Handle PDF files specially
            if PDF_AVAILABLE:
                try:
                    # Read PDF with PyPDF2
                    with open(file_path, 'rb') as f:
                        pdf_reader = PyPDF2.PdfReader(f)
                        for page_num in range(len(pdf_reader.pages)):
                            page = pdf_reader.pages[page_num]
                            content += page.extract_text() + "\n\n"
                    
                    # If content is empty, PDF might be scanned/image-based
                    if not content.strip():
                        content = "This appears to be a scanned PDF without extractable text. OCR processing is required."
                except Exception as e:
                    content = f"Error extracting text from PDF: {str(e)}"
                    print(f"PDF extraction error for {file_path}: {str(e)}")
            else:
                content = "PDF processing is not available. Please install PyPDF2 to enable PDF text extraction."
        else:
            # Read regular text files
            try:
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
            except UnicodeDecodeError:
                # Try binary mode as fallback for problematic files
                with open(file_path, 'rb') as f:
                    content = str(f.read())
        
        # Set up the prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_template.format(instructions=instruction_text)),
            ("human", "Here is the text content to analyze and extract information from:\n\n{content}")
        ])
        
        # Create a proper prompt using our utility function
        prompt = create_prompt(
            system_template=self.system_template.format(instructions=instruction_text),
            human_template="Here is the text content to analyze and extract information from:\n\n{content}"
        )
        
        # Run the LLM chain using our utility function
        result_dict = await run_llm_chain(prompt, self.llm, {"content": content})
        
        # Create a compatible result object
        if result_dict.get("success", False):
            result_content = result_dict.get("content", "")
        else:
            error_msg = result_dict.get("error", "Unknown error")
            result_content = f"Error processing content from {file_path}: {error_msg}"
        
        # Extract structured data 
        extracted_text = result_content
        
        # Try to parse as JSON if it looks like JSON
        structured_data = {}
        try:
            # Check if the result contains a JSON object
            if "{" in extracted_text and "}" in extracted_text:
                # Try to extract JSON from the text
                json_start = extracted_text.find("{")
                json_end = extracted_text.rfind("}") + 1
                json_str = extracted_text[json_start:json_end]
                
                structured_data = json.loads(json_str)
            else:
                # If not JSON, keep as text
                structured_data = {"extracted_text": extracted_text}
        except json.JSONDecodeError:
            # If JSON parsing fails, keep as text
            structured_data = {"extracted_text": extracted_text}
        
        # Add metadata
        structured_data["metadata"] = metadata
        
        return {
            "text_processing_result": structured_data,
            "file_type": "text",
            "mime_type": mimetypes.guess_type(file_path)[0] or "text/plain"
        }
        
    async def run_with_tracing(self, file_path: str, instructions: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a text file with tracing if available, falls back to regular processing if not
        
        Args:
            file_path: Path to the text file
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
                "text_processing_result": result,
                "file_path": file_path,
                "file_type": "text",
                "instructions": instructions
            }
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            print(f"Error in run_with_tracing for TextProcessor: {str(e)}\n{error_traceback}")
            
            return {
                "status": "error",
                "error": str(e),
                "traceback": error_traceback,
                "file_path": file_path,
                "file_type": "text"
            }
