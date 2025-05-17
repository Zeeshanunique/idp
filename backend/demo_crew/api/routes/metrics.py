"""
Metrics routes for the dashboard.
"""
import os
import json
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta
import random  # For demo data generation

# Try to import LangSmith integration
try:
    from ..langsmith_integration import setup_langsmith
    LANGSMITH_AVAILABLE = True
except ImportError:
    LANGSMITH_AVAILABLE = False

# Create router
router = APIRouter(tags=["Metrics"])

def count_files_by_type() -> Dict[str, int]:
    """
    Count the number of files in each upload directory
    
    Returns:
        Dictionary with counts of files by type
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    upload_dir = os.path.join(base_dir, "uploads")
    
    counts = {
        "text": 0,
        "image": 0,
        "audio": 0,
        "video": 0,
    }
    
    # Count files in each subdirectory
    for doc_type in counts.keys():
        type_dir = os.path.join(upload_dir, doc_type)
        if os.path.exists(type_dir) and os.path.isdir(type_dir):
            counts[doc_type] = len([f for f in os.listdir(type_dir) 
                                 if os.path.isfile(os.path.join(type_dir, f)) 
                                 and not f.startswith('.')])
    
    return counts

def get_langsmith_metrics() -> Dict[str, Any]:
    """
    Get metrics from LangSmith if available
    
    Returns:
        Dictionary with LangSmith metrics or mock data if unavailable
    """
    if not LANGSMITH_AVAILABLE:
        # Return mock data if LangSmith is not available
        return {
            "connected": False,
            "accuracy": random.uniform(85.0, 95.0),
            "completeness": random.uniform(80.0, 90.0),
            "consistency": random.uniform(85.0, 95.0),
            "reliability": random.uniform(90.0, 98.0),
        }
    
    # Try to set up LangSmith client
    client = setup_langsmith()
    if not client:
        # Return mock data if client setup fails
        return {
            "connected": False,
            "accuracy": random.uniform(85.0, 95.0),
            "completeness": random.uniform(80.0, 90.0),
            "consistency": random.uniform(85.0, 95.0),
            "reliability": random.uniform(90.0, 98.0),
        }
    
    # In a real implementation, we would query LangSmith for metrics
    # For now, return enhanced mock data to indicate connection success
    return {
        "connected": True,
        "project": os.environ.get("LANGCHAIN_PROJECT", "demo_crew"),
        "accuracy": random.uniform(88.0, 97.0),
        "completeness": random.uniform(85.0, 95.0),
        "consistency": random.uniform(87.0, 97.0),
        "reliability": random.uniform(92.0, 99.0),
    }

def get_processed_file_metrics() -> Dict[str, Any]:
    """
    Calculate metrics about processed files
    
    Returns:
        Dictionary with processing statistics
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    processed_dir = os.path.join(base_dir, "uploads", "processed")
    
    # Get list of processed files
    processed_files = []
    if os.path.exists(processed_dir) and os.path.isdir(processed_dir):
        processed_files = [f for f in os.listdir(processed_dir) 
                           if os.path.isfile(os.path.join(processed_dir, f)) 
                           and f.endswith('.json')]
    
    # For now, we'll use mock timing data
    # In a real implementation, we could extract this from the JSON files
    doc_types = ["text", "image", "audio", "video"]
    proc_times = {
        "text": random.uniform(1.0, 2.0),
        "image": random.uniform(2.0, 3.0),
        "audio": random.uniform(3.0, 4.0),
        "video": random.uniform(5.0, 7.0),
    }
    
    # Count successful vs. failed processing
    success_count = int(len(processed_files) * random.uniform(0.9, 0.98))
    total_count = len(processed_files)
    success_rate = (success_count / total_count * 100) if total_count > 0 else 0
    
    # Get the average processing time across all document types
    avg_processing_time = sum(proc_times.values()) / len(proc_times) if proc_times else 0
    
    # Get the last modified time of the most recently modified file
    last_processed = datetime.now()
    if processed_files:
        last_file_path = os.path.join(processed_dir, processed_files[0])
        try:
            last_processed = datetime.fromtimestamp(os.path.getmtime(last_file_path))
        except:
            pass
    
    return {
        "totalProcessed": total_count,
        "successCount": success_count,
        "failureCount": total_count - success_count,
        "successRate": round(success_rate, 1),
        "averageProcessingTime": round(avg_processing_time, 1),
        "processingTimeByType": [
            {"name": doc_type, "time": round(proc_times[doc_type], 1)} 
            for doc_type in doc_types
        ],
        "lastProcessed": last_processed.isoformat(),
    }

def get_privacy_risk_metrics() -> Dict[str, Any]:
    """
    Calculate privacy risk metrics
    
    Returns:
        Dictionary with privacy risk assessment
    """
    # In a real implementation, we would scan files for PII and sensitive content
    # For now, use mock data
    
    # Simulate PII detection
    detected_pii = random.randint(0, 5)
    sensitive_content = random.randint(0, 2)
    
    # Determine overall risk based on detected PII and sensitive content
    overall_risk = "Low"
    if detected_pii > 4 or sensitive_content > 1:
        overall_risk = "High"
    elif detected_pii > 2 or sensitive_content > 0:
        overall_risk = "Medium"
    
    # Generate appropriate recommendations based on risk level
    recommendations = ["Implement regular data retention policies"]
    
    if overall_risk == "Medium" or overall_risk == "High":
        recommendations.append("Implement PII redaction for document uploads")
    
    if overall_risk == "High":
        recommendations.append("Enable content filtering for sensitive information")
        recommendations.append("Restrict access to sensitive documents")
    
    return {
        "overall": overall_risk,
        "piiDetected": detected_pii,
        "sensitiveContentWarnings": sensitive_content,
        "dataRetentionCompliance": "Compliant" if overall_risk != "High" else "Non-Compliant",
        "recommendations": recommendations,
    }

def get_activity_log() -> List[Dict[str, Any]]:
    """
    Get recent processing activity
    
    Returns:
        List of recent activities
    """
    # In a real implementation, we would extract this from logs or database
    # For now, use mock data
    doc_types = ["text", "image", "audio", "video"]
    statuses = ["success", "warning", "error"]
    status_weights = [0.85, 0.1, 0.05]  # Distribution of status types
    
    sample_filenames = {
        "text": ["financial_report.pdf", "contract.docx", "user_manual.pdf", "legal_document.txt"],
        "image": ["contract_scan.png", "receipt.jpg", "diagram.jpeg", "floor_plan.png"],
        "audio": ["interview.wav", "meeting_recording.m4a", "phone_call.mp3", "presentation.ogg"],
        "video": ["demo.mp4", "tutorial.mov", "conference.mp4", "training.webm"],
    }
    
    # Generate random activities for the past week
    activities = []
    for i in range(20):  # Generate 20 activities
        doc_type = random.choice(doc_types)
        status = random.choices(statuses, weights=status_weights)[0]
        
        # Random timestamp within the past week
        days_ago = random.uniform(0, 7)
        timestamp = (datetime.now() - timedelta(days=days_ago)).isoformat()
        
        activities.append({
            "id": i + 1,
            "type": doc_type,
            "status": status,
            "timestamp": timestamp,
            "filename": random.choice(sample_filenames[doc_type]),
        })
    
    # Sort by timestamp, most recent first
    activities.sort(key=lambda a: a["timestamp"], reverse=True)
    
    # Take only the 10 most recent
    return activities[:10]

def get_weekly_activity() -> List[Dict[str, Any]]:
    """
    Get document processing activity by day for the past week
    
    Returns:
        List of daily activity counts
    """
    # In a real implementation, we would query logs or database
    # For now, use mock data
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    # Generate random counts, higher on weekdays
    counts = []
    for day in days:
        if day in ["Sat", "Sun"]:
            count = random.randint(1, 5)  # Less activity on weekends
        else:
            count = random.randint(6, 15)  # More activity on weekdays
        
        counts.append({"day": day, "count": count})
    
    return counts

@router.get("/dashboard/metrics")
async def get_dashboard_metrics() -> Dict[str, Any]:
    """
    Get all metrics for the dashboard
    
    Returns:
        JSON object with all dashboard metrics
    """
    try:
        # Get file counts
        file_counts = count_files_by_type()
        
        # Get processing metrics
        processing_stats = get_processed_file_metrics()
        
        # Get LangSmith metrics
        langsmith_metrics = get_langsmith_metrics()
        
        # Get privacy risk assessment
        privacy_risk = get_privacy_risk_metrics()
        
        # Get activity log
        activity_log = get_activity_log()
        
        # Get weekly activity
        weekly_activity = get_weekly_activity()
        
        # Format document type data for pie chart
        colors = {
            "text": "#3b82f6",  # blue
            "image": "#10b981",  # emerald
            "audio": "#f59e0b",  # amber
            "video": "#8b5cf6",  # purple
        }
        
        document_type_data = [
            {"name": doc_type.capitalize(), "value": count, "color": colors.get(doc_type, "#6b7280")}
            for doc_type, count in file_counts.items()
        ]
        
        # Compile all metrics
        return {
            "documentCounts": file_counts,
            "processingStats": processing_stats,
            "modelPerformance": {
                "accuracy": round(langsmith_metrics["accuracy"], 1),
                "completeness": round(langsmith_metrics["completeness"], 1),
                "consistency": round(langsmith_metrics["consistency"], 1),
                "reliability": round(langsmith_metrics["reliability"], 1),
            },
            "langsmithStatus": {
                "connected": langsmith_metrics["connected"],
                "project": langsmith_metrics.get("project", "unknown"),
            },
            "privacyRisk": privacy_risk,
            "activityLog": activity_log,
            "documentTypeData": document_type_data,
            "processingTimeData": processing_stats["processingTimeByType"],
            "weeklyActivity": weekly_activity,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error generating dashboard metrics: {str(e)}"
        )
