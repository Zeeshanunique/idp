# Audio Transcription in IDP

## Overview
The IDP (Intelligent Document Processing) system now includes robust audio transcription capabilities. Audio files uploaded to the system are automatically transcribed using OpenAI's advanced speech-to-text models, providing accurate and reliable transcriptions of the audio content.

## Features
- **Automatic Transcription**: All uploaded audio files are automatically processed for transcription
- **Enhanced UI**: Transcriptions are clearly displayed in the UI with proper formatting and visual indicators
- **Fallback Mechanisms**: Multiple fallback options ensure users always get results, even if transcription fails
- **Pre-processing Support**: Process audio files in batches with the `reprocess_audio.py` script
- **Targeted Processing**: Process individual files with the `process_single_audio.py` script

## How It Works
1. **Upload**: Audio files (.wav, .mp3, .m4a, etc.) are uploaded to the system
2. **Processing**: The backend uses OpenAI's API to transcribe the audio content
3. **Storage**: Transcription results are stored as JSON files in the `uploads/processed/` directory
4. **Display**: The frontend displays the transcriptions with proper formatting and styling

## Models Used
The system tries multiple models in sequence for best results:
1. `gpt-4o-transcribe` - Advanced model with high accuracy
2. `gpt-4o-mini-transcribe` - Smaller, faster model (fallback)
3. `whisper-1` - Reliable older model (fallback)

## Implementation Details

### Backend
- `audio_tools.py`: Contains the logic for audio file processing and transcription
- `reprocess_audio.py`: Script for batch processing existing audio files
- `process_single_audio.py`: Script for processing individual audio files

### Frontend
- `DatasetDisplay.tsx`: Enhanced to display audio transcriptions with proper UI elements
- Includes visual indicators for transcription status (e.g., "Transcribed" badge)

## Testing and Verification
Use the provided `verify_audio_transcription.js` tool to check the status of audio transcription:

```bash
cd /workspaces/idp && node verify_audio_transcription.js
```

This will:
- Check for audio files in the system
- Verify that processed files exist for each audio file
- Confirm that transcriptions contain valid text
- Check dataset integration

## Troubleshooting
If transcription is not working properly:

1. **Check API Key**: Ensure the OpenAI API key is set in the `.env` file
2. **Process Missing Files**: Use `process_single_audio.py` to process specific files
3. **Verify Backend Integration**: Check `audio_tools.py` to ensure it's looking for processed files
4. **Inspect UI**: Check the frontend to ensure it's properly rendering the transcription data

## Future Improvements
- Add support for more audio file formats
- Implement speaker diarization (identifying different speakers)
- Add timestamps to transcriptions for longer files
- Support for real-time transcription of streaming audio
- Add translation capabilities for non-English audio
