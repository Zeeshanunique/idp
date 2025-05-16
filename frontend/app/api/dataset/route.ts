import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Check multiple possible dataset file locations
    const possiblePaths = [
      path.join(process.cwd(), '..', 'backend', 'simplified_dataset.json'),
      path.join(process.cwd(), '..', 'backend', 'processed_data.json'),
      path.join(process.cwd(), '..', 'backend', 'demo_crew', 'processed_data.json'),
      path.join(process.cwd(), '..', 'simplified_dataset.json')
    ];
    
    let dataset = { results: [] };
    let datasetLoaded = false;
    
    // Try each path until we find a valid dataset
    for (const datasetPath of possiblePaths) {
      try {
        if (fs.existsSync(datasetPath)) {
          dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
          console.log(`Dataset loaded successfully from: ${datasetPath}`);
          datasetLoaded = true;
          break;
        }
      } catch (pathError) {
        console.log(`Failed to load dataset from ${datasetPath}`);
      }
    }
    
    if (!datasetLoaded) {
      console.warn('Could not find any dataset files, returning empty dataset');
    }
    
    // Return the dataset
    return NextResponse.json(dataset, { status: 200 });
  } catch (error) {
    console.error('Error loading dataset:', error);
    return NextResponse.json(
      { error: 'Failed to load dataset' }, 
      { status: 500 }
    );
  }
}