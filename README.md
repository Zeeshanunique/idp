# Autonomous Document Intelligence Platform (IDP)

A sophisticated platform that transforms unstructured documents and media into structured intelligence using a team of specialized AI agents.

## Project Overview

The Autonomous Document Intelligence Platform (IDP) is designed to process various types of documents and media files (text, images, audio, video) and extract meaningful structured information from them. The system employs a multi-agent approach, with specialized AI processors for different file types, coordinated by a master agent.

## Key Features

- **Multi-format Processing:** Handles text documents, images, audio recordings, and video files
- **Advanced Audio Transcription:** Utilizes OpenAI's audio models for precise speech-to-text conversion
- **Multi-agent Architecture:** Specialized AI agents for different file types
- **Structured Output:** Transforms unstructured content into structured, queryable data
- **Document Graph:** Creates relationships between processed documents
- **Modern Frontend:** User-friendly interface built with Next.js and Tailwind CSS
- **API-first Design:** RESTful API endpoints for all functionality
- **Background Processing:** Asynchronous processing for large files

## System Architecture

### Backend

- **FastAPI Server:** Provides RESTful API endpoints
- **Processing Agents:**
  - **Audio Processor:** Transcribes and analyzes audio files
  - **Text Processor:** Extracts key information from text documents
  - **Image Processor:** Analyzes visual content
  - **Video Processor:** Extracts frames and transcribes audio from videos
- **Master Agent:** Coordinates and combines insights from specialized agents
- **Document Graph:** Maintains relationships between processed documents

### Frontend

- **Next.js Application:** Modern React-based web application
- **Tailwind CSS:** Responsive and clean UI design
- **TypeScript:** Type-safe frontend codebase
- **API Integration:** Seamlessly communicates with backend services

## Getting Started

### Prerequisites

- Python 3.10+ for the backend
- Node.js 18+ and npm for the frontend
- OpenAI API key (for audio transcription and advanced processing)
- Git (for cloning the repository)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/idp.git
   cd idp
   ```

2. Set up a Python virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key
   PORT=8000
   ```

5. Run the API server:
   ```bash
   python run_api.py
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Create a `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Audio Transcription

The platform features advanced audio transcription capabilities:

- **OpenAI Whisper Integration:** High-quality speech-to-text conversion
- **Multiple Format Support:** Processes WAV, MP3, M4A, FLAC, OGG, and AAC files
- **Fallback Mechanisms:** Graceful degradation when API limitations are encountered
- **Structured Output:** Returns timestamps, speaker segmentation, and confidence scores

To reprocess audio files with the latest transcription models:

```bash
cd backend
python reprocess_audio.py
```

To process a single audio file:

```bash
cd backend
python process_single_audio.py filename.mp3
```

## API Endpoints

### Upload API

- `POST /api/upload/file` - Upload a file for processing
- `GET /api/upload/status/{job_id}` - Check processing status
- `GET /api/upload/results/{job_id}` - Get processing results

### Dataset API

- `GET /api/dataset/list` - List available datasets
- `POST /api/dataset/create` - Create a new dataset
- `GET /api/dataset/{dataset_id}` - Get dataset details

### Metrics API

- `GET /api/metrics/system` - Get system performance metrics
- `GET /api/metrics/processing` - Get document processing statistics

## Project Structure

```
idp/
├── backend/
│   ├── demo_crew/          # Core processing modules
│   │   ├── api/            # API implementation
│   │   ├── tools/          # File processing tools
│   │   └── master_agent.py # Coordination logic
│   ├── uploads/            # Storage for uploaded files
│   ├── process_single_audio.py # Utility for single audio processing
│   ├── reprocess_audio.py  # Bulk audio reprocessing utility
│   └── run_api.py          # API server entry point
└── frontend/
    ├── app/                # Next.js pages and routes
    ├── components/         # React components
    └── lib/                # Frontend utilities
```

## License

[Your License Information]

## Acknowledgments

- OpenAI for providing the audio transcription models
- The LangChain community for agent architecture inspiration
- The FastAPI and Next.js teams for excellent frameworks
