// Test script for audio transcription functionality
const fs = require('fs');

// Path to our simulated dataset
const datasetPath = '/workspaces/idp/backend/uploads/processed/sample1.wav.json';

// Read the dataset
try {
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  
  // Check if the dataset has the expected structure
  if (dataset && dataset.results && dataset.results.length > 0) {
    const audioResult = dataset.results[0];
    
    console.log('Audio dataset loaded successfully');
    console.log('Agent type:', audioResult.agent_type);
    
    // Check if we have transcription
    if (audioResult.output && audioResult.output.transcription && audioResult.output.transcription.text) {
      console.log('✓ Transcription found:', audioResult.output.transcription.text);
    } else {
      console.log('❌ No transcription found in the dataset');
    }
    
    // Check if we have analysis
    if (audioResult.output && audioResult.output.analysis) {
      console.log('✓ Analysis found:', audioResult.output.analysis.description);
    } else {
      console.log('❌ No analysis found in the dataset');
    }
    
    // Check if we have metadata
    if (audioResult.output && audioResult.output.metadata) {
      console.log('✓ Metadata found for file:', audioResult.output.metadata.file_name);
    } else {
      console.log('❌ No metadata found in the dataset');
    }
  } else {
    console.log('❌ Dataset does not have the expected structure');
  }
} catch (error) {
  console.error('Error reading or parsing the dataset:', error);
}
