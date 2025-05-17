// Audio transcription verification tool
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_DIR = "/workspaces/idp/backend";
const SAMPLE_DATASET_PATH = path.join(BACKEND_DIR, "simplified_dataset.json");
const AUDIO_DIR = path.join(BACKEND_DIR, "uploads/audio");
const PROCESSED_DIR = path.join(BACKEND_DIR, "uploads/processed");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

console.log(`${colors.blue}=== Audio Transcription Verification Tool ===${colors.reset}`);
console.log(`${colors.cyan}This tool verifies that audio files have been properly transcribed and are ready for display in the UI.${colors.reset}\n`);

// Check if audio files exist
try {
  const audioFiles = fs.readdirSync(AUDIO_DIR).filter(file => 
    ['.wav', '.mp3', '.m4a', '.ogg', '.flac'].some(ext => file.endsWith(ext))
  );
  
  console.log(`${colors.blue}[1] Audio Files Check${colors.reset}`);
  console.log(`Found ${audioFiles.length} audio files in ${AUDIO_DIR}`);
  
  if (audioFiles.length === 0) {
    console.log(`${colors.red}✖ No audio files found! Please upload some audio files first.${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Audio files found successfully${colors.reset}`);
    
    // List a few audio files
    const sampleFiles = audioFiles.slice(0, 3);
    console.log(`Sample audio files: ${sampleFiles.join(', ')}${audioFiles.length > 3 ? ` and ${audioFiles.length - 3} more...` : ''}`);
  }
  
  // Check if processed files exist
  const processedFiles = fs.readdirSync(PROCESSED_DIR).filter(file => 
    file.endsWith('.json') && audioFiles.some(audioFile => file === `${audioFile}.json`)
  );
  
  console.log(`\n${colors.blue}[2] Processed Transcription Files Check${colors.reset}`);
  console.log(`Found ${processedFiles.length} processed JSON files for audio in ${PROCESSED_DIR}`);
  
  const missingProcessed = audioFiles.filter(audioFile => 
    !fs.existsSync(path.join(PROCESSED_DIR, `${audioFile}.json`))
  );
  
  if (missingProcessed.length > 0) {
    console.log(`${colors.yellow}⚠ Missing processed files for ${missingProcessed.length} audio files:${colors.reset}`);
    missingProcessed.slice(0, 3).forEach(file => {
      console.log(`   - ${file}`);
    });
    if (missingProcessed.length > 3) {
      console.log(`   - ... and ${missingProcessed.length - 3} more`);
    }
    console.log(`\n${colors.yellow}These files may need to be processed with reprocess_audio.py${colors.reset}`);
  } else if (processedFiles.length === 0) {
    console.log(`${colors.red}✖ No processed files found! You need to run the reprocess_audio.py script.${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ All audio files have corresponding processed JSON files${colors.reset}`);
  }
  
  // Check for transcriptions in processed files
  console.log(`\n${colors.blue}[3] Transcription Content Check${colors.reset}`);
  
  let transcribedCount = 0;
  let noTranscriptionCount = 0;
  let errorCount = 0;
  
  for (const processedFile of processedFiles) {
    try {
      const fullPath = path.join(PROCESSED_DIR, processedFile);
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      
      if (data && data.results && data.results[0].output && data.results[0].output.transcription) {
        const transcription = data.results[0].output.transcription;
        if (transcription.text && transcription.text.length > 0) {
          transcribedCount++;
        } else {
          noTranscriptionCount++;
        }
      } else {
        noTranscriptionCount++;
      }
    } catch (err) {
      console.error(`Error processing ${processedFile}: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`Processed files summary:`);
  console.log(`${colors.green}✓ Files with transcription: ${transcribedCount}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Files without transcription text: ${noTranscriptionCount}${colors.reset}`);
  console.log(`${colors.red}✖ Files with errors: ${errorCount}${colors.reset}`);
  
  if (transcribedCount > 0) {
    // Sample a transcription to show
    let sampleTranscription = null;
    for (const processedFile of processedFiles) {
      try {
        const fullPath = path.join(PROCESSED_DIR, processedFile);
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        
        if (data && data.results && data.results[0].output && 
            data.results[0].output.transcription && 
            data.results[0].output.transcription.text) {
          sampleTranscription = {
            file: processedFile,
            text: data.results[0].output.transcription.text,
            model: data.results[0].output.transcription.metadata?.model || 'unknown'
          };
          break;
        }
      } catch (err) {
        // Continue to the next file
      }
    }
    
    if (sampleTranscription) {
      console.log(`\n${colors.blue}Sample transcription from ${sampleTranscription.file}:${colors.reset}`);
      console.log(`Model: ${sampleTranscription.model}`);
      console.log(`Text: "${sampleTranscription.text.slice(0, 150)}${sampleTranscription.text.length > 150 ? '...' : ''}"`);
    }
  }
  
  // Check if the dataset file includes the audio files
  console.log(`\n${colors.blue}[4] Dataset Integration Check${colors.reset}`);
  if (fs.existsSync(SAMPLE_DATASET_PATH)) {
    try {
      const dataset = JSON.parse(fs.readFileSync(SAMPLE_DATASET_PATH, 'utf8'));
      const audioResults = dataset.results ? dataset.results.filter(item => 
        item.agent_type && item.agent_type.includes('audio')
      ) : [];
      
      console.log(`Found ${audioResults.length} audio entries in the dataset file`);
      
      if (audioResults.length > 0) {
        console.log(`${colors.green}✓ Dataset contains audio entries${colors.reset}`);
        
        // Check for transcriptions in the dataset
        const withTranscription = audioResults.filter(item => {
          try {
            const output = typeof item.output === 'string' ? JSON.parse(item.output) : item.output;
            return output && output.transcription && output.transcription.text;
          } catch (e) {
            return false;
          }
        });
        
        console.log(`${withTranscription.length} out of ${audioResults.length} audio entries have transcriptions`);
        
        if (withTranscription.length === 0) {
          console.log(`${colors.yellow}⚠ No audio entries in the dataset have transcriptions${colors.reset}`);
        }
      } else {
        console.log(`${colors.yellow}⚠ No audio entries found in the dataset${colors.reset}`);
      }
    } catch (err) {
      console.error(`Error reading dataset file: ${err.message}`);
    }
  } else {
    console.log(`${colors.yellow}⚠ Dataset file not found at ${SAMPLE_DATASET_PATH}${colors.reset}`);
  }
  
  // Provide next steps
  console.log(`\n${colors.blue}=== Summary ===${colors.reset}`);
  if (transcribedCount > 0) {
    console.log(`${colors.green}✓ Audio transcription is set up correctly${colors.reset}`);
    console.log(`${colors.green}✓ Frontend should display transcriptions with the enhanced UI${colors.reset}`);
    console.log("\nNext steps:");
    console.log("1. Verify through the web interface that transcriptions are displayed properly");
    console.log("2. Test uploading new audio files to ensure they get transcribed");
  } else {
    console.log(`${colors.yellow}⚠ No transcriptions found. You may need to:${colors.reset}`);
    console.log("1. Run the reprocess_audio.py script to generate transcriptions");
    console.log("2. Check that the OpenAI API key is set correctly in the .env file");
    console.log("3. Verify there are audio files in the uploads/audio directory");
  }
  
} catch (error) {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  console.error(error);
}
