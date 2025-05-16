"""
LangSmith integration for tracing and monitoring LangChain applications.
This module provides optional LangSmith integration with graceful fallbacks.
"""
import os
from typing import Dict, Any, Optional, List
from datetime import datetime
from dotenv import load_dotenv

# Wrap LangSmith imports in try/except to handle missing dependencies
try:
    from langsmith import Client
    LANGSMITH_AVAILABLE = True
except ImportError:
    LANGSMITH_AVAILABLE = False
    print("LangSmith library not available. LangSmith functionality will be disabled.")
    # Create a dummy Client class for type checking
    class Client:
        pass

def setup_langsmith() -> Optional[Client]:
    """
    Set up and return a LangSmith client if proper environment variables are set.
    
    Returns:
        Optional[Client]: LangSmith client if configured, None otherwise
    """
    # First check if LangSmith library is available
    if not LANGSMITH_AVAILABLE:
        print("LangSmith tracing is not available - langsmith package not installed.")
        return None
    
    # Check if required environment variables are set
    api_key = os.environ.get("LANGCHAIN_API_KEY")
    tracing_enabled = os.environ.get("LANGCHAIN_TRACING_V2", "false").lower() == "true"
    
    if not api_key or not tracing_enabled:
        print("LangSmith tracing is not enabled. Set LANGCHAIN_API_KEY and LANGCHAIN_TRACING_V2=true to enable.")
        return None
    
    try:
        # Create and return the LangSmith client
        client = Client(
            api_key=api_key,
            api_url=os.environ.get("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com"),
        )
        
        # Test connection - using a simple call that should always work
        try:
            _ = client.list_projects(limit=1)
            print(f"LangSmith tracing is enabled for project: {os.environ.get('LANGCHAIN_PROJECT', 'default')}")
            return client
        except:
            print("LangSmith connection test failed. Disabling LangSmith integration.")
            return None
    except Exception as e:
        print(f"Failed to initialize LangSmith client: {str(e)}")
        return None

def track_agent_performance(client: Optional[Client], 
                           run_id: str, 
                           agent_type: str, 
                           metrics: Dict[str, Any]) -> None:
    """
    Track agent performance metrics in LangSmith.
    
    Args:
        client: LangSmith client
        run_id: The run ID to update
        agent_type: Type of agent (text, image, audio, video)
        metrics: Performance metrics to track
    """
    if not client or not run_id or not LANGSMITH_AVAILABLE:
        return
    
    try:
        # Add metrics as feedback
        client.create_feedback(
            run_id=run_id,
            key=f"{agent_type}_metrics",
            score=metrics.get("accuracy", 0.0),
            value=metrics,
            comment=f"Performance metrics for {agent_type} processing"
        )
    except Exception as e:
        print(f"Failed to track performance in LangSmith: {str(e)}")

def create_evaluation_dataset(client: Optional[Client],
                             run_ids: List[str],
                             dataset_name: str,
                             description: str = "") -> Optional[str]:
    """
    Create a dataset for evaluation from completed runs.
    
    Args:
        client: LangSmith client
        run_ids: List of run IDs to include in the dataset
        dataset_name: Name for the new dataset
        description: Optional description for the dataset
        
    Returns:
        Optional[str]: Dataset ID if successful, None otherwise
    """
    if not client or not run_ids or not LANGSMITH_AVAILABLE:
        return None
    
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        full_name = f"{dataset_name}_{timestamp}"
        
        # Create dataset from runs
        dataset = client.create_dataset(
            dataset_name=full_name,
            description=description or f"Dataset created on {timestamp}"
        )
        
        # Add examples from runs
        for run_id in run_ids:
            try:
                run = client.read_run(run_id)
                
                # Extract inputs and outputs from the run
                inputs = run.inputs
                outputs = run.outputs if hasattr(run, 'outputs') and run.outputs else {}
                
                # Create example
                client.create_example(
                    inputs=inputs,
                    outputs=outputs,
                    dataset_id=dataset.id
                )
            except Exception as inner_e:
                print(f"Failed to add run {run_id} to dataset: {str(inner_e)}")
        
        print(f"Created dataset {full_name} with {len(run_ids)} examples")
        return dataset.id
    except Exception as e:
        print(f"Failed to create dataset: {str(e)}")
        return None
