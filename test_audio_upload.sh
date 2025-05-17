#!/bin/bash

# Test script for audio upload and transcription
# This script tests the full flow of uploading an audio file and verifying that it gets transcribed

echo -e "\e[1;36m=== Audio Transcription Testing Script ===\e[0m"
echo -e "This script tests the end-to-end flow of uploading and transcribing audio files."

# Configuration
BACKEND_DIR="/workspaces/idp/backend"
AUDIO_DIR="$BACKEND_DIR/uploads/audio"
PROCESSED_DIR="$BACKEND_DIR/uploads/processed"
TEMP_DIR="/tmp/audio_test"

# Create temp directory
echo -e "\n\e[1;34m[1] Setting up test environment\e[0m"
mkdir -p "$TEMP_DIR"

# Generate a test audio file if we don't have one
TEST_AUDIO_FILE="$TEMP_DIR/test_audio_$(date +%s).wav"

echo -e "Generating test audio file: $TEST_AUDIO_FILE"

# Check if we have sox (Sound eXchange) installed
if command -v sox &> /dev/null; then
    # Generate a 3-second test tone
    sox -n "$TEST_AUDIO_FILE" synth 3 sine 440 vol -10dB
    echo -e "\e[32m✓ Created test audio file with sox\e[0m"
else
    # If sox is not available, create an empty wav file
    echo "RIFF....WAVEfmt .......data...." > "$TEST_AUDIO_FILE"
    echo -e "\e[33m⚠ Created placeholder audio file (sox not available)\e[0m"
fi

# Generate a unique ID for the test file
TEST_ID=$(uuidgen 2>/dev/null || echo "test-$(date +%s)")
TEST_AUDIO_FILENAME="${TEST_ID}.wav"
DESTINATION="$AUDIO_DIR/$TEST_AUDIO_FILENAME"

echo -e "\n\e[1;34m[2] Uploading test audio file\e[0m"
echo "Source: $TEST_AUDIO_FILE"
echo "Destination: $DESTINATION"

# Copy file to audio directory
cp "$TEST_AUDIO_FILE" "$DESTINATION"
if [ $? -eq 0 ]; then
    echo -e "\e[32m✓ Uploaded test audio file successfully\e[0m"
else
    echo -e "\e[31m✖ Failed to upload test audio file\e[0m"
    exit 1
fi

echo -e "\n\e[1;34m[3] Processing audio file\e[0m"
echo "Running transcription process..."

cd "$BACKEND_DIR"

# Extract the OpenAI API key from the .env file
OPENAI_API_KEY=$(grep -oP 'OPENAI_API_KEY=\K.*' .env)

if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "\e[31m✖ OpenAI API key not found in .env file\e[0m"
    exit 1
fi

# Process the audio file
OPENAI_API_KEY="$OPENAI_API_KEY" python process_single_audio.py "$TEST_AUDIO_FILENAME"

# Check if the processed file exists
PROCESSED_FILE="$PROCESSED_DIR/${TEST_AUDIO_FILENAME}.json"

echo -e "\n\e[1;34m[4] Verifying results\e[0m"
if [ -f "$PROCESSED_FILE" ]; then
    echo -e "\e[32m✓ Processed file created: $PROCESSED_FILE\e[0m"
    
    # Check if the file contains a transcription
    if grep -q "transcription" "$PROCESSED_FILE"; then
        echo -e "\e[32m✓ Transcription found in processed file\e[0m"
        
        # Extract a preview of the transcription text
        TEXT=$(grep -oP '"text": "\K[^"]*' "$PROCESSED_FILE" | head -1)
        MODEL=$(grep -oP '"model": "\K[^"]*' "$PROCESSED_FILE")
        
        echo -e "\e[36mTranscription preview: \"$TEXT...\"\e[0m"
        echo -e "\e[36mModel used: $MODEL\e[0m"
        
        # Clean up if requested
        if [ "$1" == "--cleanup" ]; then
            echo -e "\n\e[1;34m[5] Cleaning up\e[0m"
            rm "$DESTINATION"
            rm "$PROCESSED_FILE"
            rm -rf "$TEMP_DIR"
            echo -e "\e[32m✓ Cleaned up test files\e[0m"
        else
            echo -e "\n\e[33mTest files left in place. Run with --cleanup to remove them.\e[0m"
        fi
        
        echo -e "\n\e[1;32m=== Test Completed Successfully ===\e[0m"
    else
        echo -e "\e[31m✖ No transcription found in processed file\e[0m"
        exit 1
    fi
else
    echo -e "\e[31m✖ Processed file not created\e[0m"
    exit 1
fi
