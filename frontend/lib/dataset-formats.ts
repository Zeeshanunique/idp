import { Dataset } from './dataset-utils';

/**
 * Converts a dataset to CSV format
 */
export function convertToCSV(dataset: Dataset): string {
  // Create header row
  const header = 'agent_type,output';
  
  // Create data rows
  const rows = dataset.results.map(item => {
    // Escape quotes in output by doubling them
    const escapedOutput = item.output.replace(/"/g, '""');
    // Wrap output in quotes to handle newlines and commas
    return `${item.agent_type},"${escapedOutput}"`;
  });
  
  return [header, ...rows].join('\n');
}

/**
 * Converts a dataset to XML format
 */
export function convertToXML(dataset: Dataset): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<dataset>\n';
  
  dataset.results.forEach(item => {
    xml += '  <result>\n';
    xml += `    <agent_type>${escapeXML(item.agent_type)}</agent_type>\n`;
    xml += `    <output>${escapeXML(item.output)}</output>\n`;
    xml += '  </result>\n';
  });
  
  xml += '</dataset>';
  return xml;
}

/**
 * Converts a dataset to plain text format
 */
export function convertToText(dataset: Dataset): string {
  let text = 'DATASET CONTENTS\n==============\n\n';
  
  dataset.results.forEach((item, index) => {
    text += `ENTRY ${index + 1}\n`;
    text += `Type: ${item.agent_type}\n`;
    text += `Output:\n${item.output}\n\n`;
    text += '----------------------------\n\n';
  });
  
  return text;
}

/**
 * Helper function to escape special XML characters
 */
function escapeXML(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Parse CSV text into a Dataset object
 */
export function parseCSV(csv: string): Dataset {
  const lines = csv.split('\n').filter(line => line.trim() !== '');
  const results = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle quoted CSV properly (this is a simplified version)
    let inQuotes = false;
    let currentField = '';
    const fields = [];
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    fields.push(currentField);
    
    // Remove surrounding quotes from fields
    const cleanFields = fields.map(field => {
      if (field.startsWith('"') && field.endsWith('"')) {
        return field.substring(1, field.length - 1).replace(/""/g, '"');
      }
      return field;
    });
    
    if (cleanFields.length >= 2) {
      results.push({
        agent_type: cleanFields[0],
        output: cleanFields[1]
      });
    }
  }
  
  return { results };
}
