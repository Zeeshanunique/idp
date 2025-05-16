import os
import shutil
from typing import List, Dict, Any, Optional
from pathlib import Path

def get_mime_type(file_extension: str) -> str:
    """
    Get the MIME type for a given file extension
    """
    mime_types = {
        # Text documents
        ".txt": "text/plain",
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".csv": "text/csv",
        
        # Images
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".tiff": "image/tiff",
        ".webp": "image/webp",
        
        # Videos
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".webm": "video/webm",
        
        # Audio
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".flac": "audio/flac",
        ".ogg": "audio/ogg",
    }
    
    return mime_types.get(file_extension.lower(), "application/octet-stream")

def get_file_type_from_extension(file_extension: str) -> Optional[str]:
    """
    Get the file type category (text, image, video, audio) from extension
    """
    text_extensions = [".txt", ".pdf", ".doc", ".docx", ".csv"]
    image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".tiff", ".webp"]
    video_extensions = [".mp4", ".mov", ".webm"]
    audio_extensions = [".mp3", ".wav", ".flac", ".ogg"]
    
    if file_extension.lower() in text_extensions:
        return "text"
    elif file_extension.lower() in image_extensions:
        return "image"
    elif file_extension.lower() in video_extensions:
        return "video"
    elif file_extension.lower() in audio_extensions:
        return "audio"
    else:
        return None

def get_files_in_directory(directory: str) -> List[Dict[str, Any]]:
    """
    Get a list of files in a directory with basic metadata
    """
    files = []
    for entry in os.scandir(directory):
        if entry.is_file():
            file_path = entry.path
            file_extension = os.path.splitext(file_path)[1]
            file_type = get_file_type_from_extension(file_extension)
            
            files.append({
                "name": entry.name,
                "path": file_path,
                "size": entry.stat().st_size,
                "modified": entry.stat().st_mtime,
                "type": file_type or "unknown",
                "mime": get_mime_type(file_extension)
            })
    
    return files