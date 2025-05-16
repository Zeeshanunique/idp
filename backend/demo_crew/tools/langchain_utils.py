"""
Utility module for LangChain compatibility across different versions.
This module handles version differences and provides fallbacks for missing functionality.
"""
import os
import sys
import logging
from typing import Dict, Any, Optional, List, Union, Callable

logger = logging.getLogger(__name__)

# Check if we have working LangChain imports
try:
    import langchain
    from langchain_openai import ChatOpenAI
    from langchain.schema import HumanMessage, SystemMessage
    from langchain.prompts import ChatPromptTemplate
    
    # Set flag for available functionality
    LANGCHAIN_AVAILABLE = True
    logger.info(f"LangChain version {langchain.__version__} loaded successfully")
except ImportError as e:
    LANGCHAIN_AVAILABLE = False
    logger.warning(f"LangChain import failed: {str(e)}")
    
    # Create dummy classes for type checking
    class ChatOpenAI:
        def __init__(self, *args, **kwargs):
            pass
            
        async def ainvoke(self, *args, **kwargs):
            return type('obj', (object,), {'content': 'LangChain not available'})
            
    class HumanMessage:
        def __init__(self, content):
            self.content = content
            
    class SystemMessage:
        def __init__(self, content):
            self.content = content
            
    class ChatPromptTemplate:
        @staticmethod
        def from_messages(*args, **kwargs):
            return None

# Re-export these classes so they can be imported from this module
__all__ = ['ChatOpenAI', 'HumanMessage', 'SystemMessage', 'ChatPromptTemplate', 
           'get_llm', 'create_prompt', 'run_llm_chain', 'run_vision_model', 'LANGCHAIN_AVAILABLE']

def get_llm(model_name: str = "gpt-4-turbo", temperature: float = 0.2, **kwargs) -> ChatOpenAI:
    """
    Get a LangChain LLM with proper error handling
    
    Args:
        model_name: Name of the model to use
        temperature: Temperature for generation
        **kwargs: Additional arguments to pass to the LLM
        
    Returns:
        ChatOpenAI instance or dummy if not available
    """
    if not LANGCHAIN_AVAILABLE:
        logger.warning("LangChain not available, returning dummy LLM")
        return ChatOpenAI()
        
    try:
        # Get API key from environment
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not found in environment")
            return ChatOpenAI()
            
        # Create and return the LLM
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            openai_api_key=api_key,
            **kwargs
        )
    except Exception as e:
        logger.error(f"Error creating LLM: {str(e)}")
        return ChatOpenAI()
        
def create_prompt(system_template: str, human_template: str) -> Optional[ChatPromptTemplate]:
    """
    Create a LangChain prompt template with error handling
    
    Args:
        system_template: System message template
        human_template: Human message template
        
    Returns:
        ChatPromptTemplate instance or None if not available
    """
    if not LANGCHAIN_AVAILABLE:
        logger.warning("LangChain not available, returning None for prompt")
        return None
        
    try:
        return ChatPromptTemplate.from_messages([
            ("system", system_template),
            ("human", human_template)
        ])
    except Exception as e:
        logger.error(f"Error creating prompt: {str(e)}")
        return None
        
async def run_llm_chain(
    prompt: Optional[ChatPromptTemplate],
    llm: Optional[ChatOpenAI],
    inputs: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Run a LangChain prompt + LLM chain with comprehensive error handling
    
    Args:
        prompt: ChatPromptTemplate to use
        llm: LLM to use
        inputs: Input values for the prompt
        
    Returns:
        Dict with results or error information
    """
    if not LANGCHAIN_AVAILABLE:
        return {
            "content": "LangChain functionality not available",
            "error": "Missing LangChain dependencies"
        }
        
    if not prompt or not llm:
        return {
            "content": "Invalid prompt or LLM",
            "error": "Missing required components"
        }
        
    try:
        # Create and run the chain
        chain = prompt | llm
        result = await chain.ainvoke(inputs)
        return {"content": result.content, "success": True}
    except Exception as e:
        import traceback
        error_msg = str(e)
        trace = traceback.format_exc()
        logger.error(f"Error running LLM chain: {error_msg}\n{trace}")
        return {
            "content": f"Error processing with LLM: {error_msg}",
            "error": error_msg,
            "traceback": trace,
            "success": False
        }
        
async def run_vision_model(
    llm: Optional[ChatOpenAI],
    text_prompt: str,
    image_data: str
) -> Dict[str, Any]:
    """
    Run a vision model on text + image data with error handling
    
    Args:
        llm: Vision-capable LLM
        text_prompt: Text prompt to accompany the image
        image_data: Base64 encoded image data or image URL
        
    Returns:
        Dict with results or error information
    """
    if not LANGCHAIN_AVAILABLE:
        return {
            "content": "Vision model functionality not available",
            "error": "Missing LangChain dependencies"
        }
        
    if not llm:
        return {
            "content": "Invalid LLM",
            "error": "Missing required vision model"
        }
        
    try:
        # Format content for vision model
        content = [
            {
                "type": "text",
                "text": text_prompt
            },
            {
                "type": "image_url",
                "image_url": {"url": image_data}
            }
        ]
        
        # Call the vision model
        result = await llm.ainvoke([HumanMessage(content=content)])
        return {"content": result.content, "success": True}
    except Exception as e:
        import traceback
        error_msg = str(e)
        trace = traceback.format_exc()
        logger.error(f"Error running vision model: {error_msg}\n{trace}")
        return {
            "content": f"Error processing with vision model: {error_msg}",
            "error": error_msg,
            "traceback": trace,
            "success": False
        }
