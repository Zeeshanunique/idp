# Document Processing API

A lightweight API for handling document uploads and processing. This simplified backend provides basic file upload and processing capabilities with a clean and maintainable structure.

## Project Overview

This is a simple FastAPI application that allows users to upload and process various types of files (text, image, audio, video). It provides RESTful endpoints for file upload, status checking, and retrieving processed results.

Key features:
- File upload and storage management
- Simplified processing workflow
- RESTful API endpoints
- Status tracking for file processing

## Installation

Ensure you have Python 3.10+ installed on your system.

```bash
# Clone the repository (if applicable)
git clone https://github.com/yourusername/document-processing-api.git
cd document-processing-api

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Copy the `.env.template` file to `.env` and adjust settings as needed:

```bash
cp .env.template .env
```

The main configuration options are:
- `PORT`: The port number to run the API server (default: 8000)
- `UPLOAD_PATH`: Path to the uploads directory (default: ./uploads)

## Project Structure

```
backend/
├── demo_crew/            # Main application package
│   ├── api/              # API endpoints and logic
│   │   ├── main.py       # FastAPI application
│   │   ├── routes/       # API routes
│   │   └── utils.py      # Helper functions
├── uploads/              # Directory for uploaded files
├── .env                  # Environment variables
├── .env.template         # Template for environment variables
├── requirements.txt      # Python dependencies
└── run_api.py           # Script to start the API server
```

## Running the Project

To start the API server:

```bash
python run_api.py
```

This will start the server at http://localhost:8000 (or the port specified in your .env file).

## API Endpoints

### Upload a File

```
POST /api/upload
```

Form parameters:
- `file`: The file to upload (required)
- `file_type`: Type of file - text, image, video, or audio (required)
- `instructions`: Processing instructions (optional)

### Check Processing Status

```
GET /api/status/{file_id}
```

Returns the current status of a processing job.

### Get Simplified Dataset

```
GET /api/dataset
```

Returns the processed data in a simplified format.

### Health Check

```
GET /api/health
```

Returns the API server status.

## Support

For support, questions, or feedback, please open an issue in the GitHub repository.
