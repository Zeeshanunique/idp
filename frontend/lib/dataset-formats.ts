import { Dataset, DatasetItem } from './dataset-utils';

/**
 * Converts a dataset to CSV format with improved handling of complex data
 * Produces a readable CSV with proper escaping and structure
 */
export function convertToCSV(dataset: Dataset): string {
  if (!dataset.results || dataset.results.length === 0) {
    return 'agent_type,raw_json,primary_content';
  }
  
  // Create header row
  const header = 'agent_type,raw_json,primary_content';
  
  // Create data rows
  const rows = dataset.results.map(item => {
    // Always include the full raw JSON for complete data preservation
    const rawJson = JSON.stringify(item.output).replace(/"/g, '""');
    
    // Extract a readable primary content for human consumption
    let primaryContent = extractPrimaryContent(item);
    primaryContent = primaryContent.replace(/"/g, '""');
    
    // Format the CSV row with agent_type, raw_json for complete data, and human-readable content
    return `${item.agent_type},"${rawJson}","${primaryContent}"`;
  });
  
  return [header, ...rows].join('\n');
}

/**
 * Extract the most meaningful text content from a dataset item
 * This helps make the CSV human-readable alongside the full JSON data
 */
function extractPrimaryContent(item: DatasetItem): string {
  const output = item.output;
  
  // Handle string output directly
  if (typeof output === 'string') {
    return output;
  }
  
  // Handle null/undefined
  if (output === null || output === undefined) {
    return '';
  }
  
  // Handle complex objects based on agent_type
  if (typeof output === 'object') {
    // Audio agent - get transcription text
    if (item.agent_type === 'audio' && output.transcription && output.transcription.text) {
      return output.transcription.text;
    }
    
    // Handle analysis output - look for transcript or summary
    if (output.analysis) {
      if (typeof output.analysis === 'string') {
        return output.analysis;
      }
      
      // Try common fields in analysis objects
      if (output.analysis.transcript) return output.analysis.transcript;
      if (output.analysis.summary) return output.analysis.summary;
      if (output.analysis.description) return output.analysis.description;
    }
    
    // General case - search for common text fields
    const textFieldNames = ['text', 'content', 'transcript', 'summary', 'description', 'message'];
    
    // Search for the first available text field
    for (const fieldName of textFieldNames) {
      if (output[fieldName] && typeof output[fieldName] === 'string') {
        return output[fieldName];
      }
    }
    
    // Deep search for text content
    const textContent = findTextContent(output);
    if (textContent) return textContent;
    
    // If we can't find meaningful text, return a summary of what the data contains
    return `[Complex data with keys: ${Object.keys(output).join(', ')}]`;
  }
  
  // Fallback for other types
  return String(output);
}

/**
 * Recursively search for text content in an object
 */
function findTextContent(obj: any, maxDepth = 3, currentDepth = 0): string {
  // Prevent excessive recursion
  if (currentDepth >= maxDepth) return '';
  if (!obj || typeof obj !== 'object') return '';
  
  // Look for common text field names
  const textFields = ['text', 'content', 'description', 'transcript', 'summary', 'message'];
  for (const key of textFields) {
    if (typeof obj[key] === 'string' && obj[key].trim().length > 0) {
      return obj[key];
    }
  }
  
  // Recursively check nested objects
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const found = findTextContent(obj[key], maxDepth, currentDepth + 1);
      if (found) return found;
    }
  }
  
  return '';
}

/**
 * Converts a dataset to XML format
 * Creates a properly structured XML with descriptive element names
 */
export function convertToXML(dataset: Dataset): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<dataset>\n';
  
  dataset.results.forEach(item => {
    xml += '  <result>\n';
    xml += `    <agent_type>${escapeXML(item.agent_type)}</agent_type>\n`;
    
    // Handle different output types
    if (typeof item.output === 'string') {
      xml += `    <output>${escapeXML(item.output)}</output>\n`;
    } else if (typeof item.output === 'object' && item.output !== null) {
      xml += '    <output>\n';
      
      // Handle audio agent output specially
      if (item.agent_type === 'audio' && item.output.transcription) {
        xml += '      <transcription>\n';
        
        // Add transcript text
        if (item.output.transcription.text) {
          xml += `        <text>${escapeXML(item.output.transcription.text)}</text>\n`;
        }
        
        // Add segments if available
        if (item.output.transcription.segments && Array.isArray(item.output.transcription.segments)) {
          xml += '        <segments>\n';
          
          item.output.transcription.segments.forEach((segment: any, idx: number) => {
            xml += '          <segment>\n';
            xml += `            <id>${segment.id !== undefined ? segment.id : idx}</id>\n`;
            xml += `            <start>${segment.start !== undefined ? segment.start : 0}</start>\n`;
            xml += `            <end>${segment.end !== undefined ? segment.end : 0}</end>\n`;
            xml += `            <text>${escapeXML(segment.text || '')}</text>\n`;
            xml += `            <confidence>${segment.confidence !== undefined ? segment.confidence : 1}</confidence>\n`;
            xml += '          </segment>\n';
          });
          
          xml += '        </segments>\n';
        }
        
        xml += '      </transcription>\n';
        
        // Add analysis if available 
        if (item.output.analysis) {
          xml += '      <analysis>\n';
          xml += jsonToXML(item.output.analysis, 8); 
          xml += '      </analysis>\n';
        }
      } 
      // General case for other structured data
      else {
        xml += jsonToXML(item.output, 6); 
      }
      
      xml += '    </output>\n';
    } else {
      xml += `    <output>${escapeXML(String(item.output))}</output>\n`;
    }
    
    xml += '  </result>\n';
  });
  
  xml += '</dataset>';
  return xml;
}

/**
 * Helper function to convert a JSON object to XML
 * Handles complex nested objects and arrays with improved formatting
 */
function jsonToXML(obj: any, indent: number = 0): string {
  const spaces = ' '.repeat(indent);
  let xml = '';
  
  if (obj === null || obj === undefined) {
    xml += `${spaces}<null/>\n`;
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      xml += `${spaces}<item index="${index}">\n`;
      if (typeof item === 'object' && item !== null) {
        xml += jsonToXML(item, indent + 2);
      } else {
        xml += `${spaces}  ${escapeXML(String(item))}\n`;
      }
      xml += `${spaces}</item>\n`;
    });
  } else if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      // Skip undefined values
      if (value === undefined) return;
      
      // Convert key to valid XML tag (remove spaces, special chars)
      const safeKey = getSafeXmlTag(key);
      
      if (value === null) {
        xml += `${spaces}<${safeKey} nil="true"/>\n`;
      } else if (typeof value === 'object') {
        xml += `${spaces}<${safeKey}>\n`;
        xml += jsonToXML(value, indent + 2);
        xml += `${spaces}</${safeKey}>\n`;
      } else {
        // For primitive values
        xml += `${spaces}<${safeKey}>${escapeXML(String(value))}</${safeKey}>\n`;
      }
    });
  } else {
    // For primitive values when called directly
    xml += `${spaces}${escapeXML(String(obj))}\n`;
  }
  
  return xml;
}

/**
 * Creates a safe XML tag name from a string
 * Handles special characters and ensures valid XML tag names
 */
function getSafeXmlTag(key: string): string {
  // Replace spaces and special characters with underscores
  let safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // XML tags can't start with numbers or certain characters
  if (/^[0-9]/.test(safeKey) || safeKey === '') {
    safeKey = '_' + safeKey;
  }
  
  return safeKey;
}

/**
 * Converts a dataset to plain text format
 */
export function convertToText(dataset: Dataset): string {
  let text = 'DATASET CONTENTS\n==============\n\n';
  
  dataset.results.forEach((item, index) => {
    text += `ENTRY ${index + 1}\n`;
    text += `Type: ${item.agent_type}\n`;
    
    // Format output based on its type
    let outputText = '';
    if (typeof item.output === 'object') {
      try {
        outputText = JSON.stringify(item.output, null, 2);
      } catch (e) {
        outputText = String(item.output);
      }
    } else {
      outputText = String(item.output || '');
    }
    
    text += `Output:\n${outputText}\n\n`;
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
 * Handles both the new 3-column format and older 2-column format
 */
export function parseCSV(csv: string): Dataset {
  const lines = csv.split('\n').filter(line => line.trim() !== '');
  const results: DatasetItem[] = [];
  
  if (lines.length === 0) {
    return { results: [] };
  }
  
  // Parse header to detect format
  const header = lines[0].toLowerCase();
  const isThreeColumnFormat = header.includes('raw_json') && header.includes('primary_content');
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Parse CSV line into fields
    const fields = parseCSVLine(line);
    
    if (fields.length < 2) continue; // Skip invalid lines
    
    let agentType = fields[0];
    let output: any;
    
    if (isThreeColumnFormat && fields.length >= 3) {
      // In 3-column format, the second column contains the raw JSON
      try {
        output = JSON.parse(fields[1]);
      } catch (e) {
        console.warn('Failed to parse JSON in CSV raw_json field:', e);
        // Fall back to using the third column (primary_content) as a string
        output = fields.length >= 3 ? fields[2] : fields[1];
      }
    } else {
      // Legacy 2-column format - try to parse the second column as JSON if applicable
      try {
        // Check if it looks like JSON
        if ((fields[1].trim().startsWith('{') && fields[1].trim().endsWith('}')) || 
            (fields[1].trim().startsWith('[') && fields[1].trim().endsWith(']'))) {
          output = JSON.parse(fields[1]);
        } else {
          output = fields[1];
        }
      } catch (e) {
        console.warn('Failed to parse JSON in CSV:', e);
        output = fields[1];
      }
    }
    
    results.push({
      agent_type: agentType,
      output: output
    });
  }
  
  return { results };
}

/**
 * Parse a single CSV line, handling quoted fields correctly
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let inQuotes = false;
  let currentField = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Check if this is an escaped quote (two double quotes in a row)
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        currentField += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      fields.push(currentField);
      currentField = '';
    } else {
      // Add character to current field
      currentField += char;
    }
  }
  
  // Add the last field
  fields.push(currentField);
  
  return fields;
}

/**
 * Parse XML text into a Dataset object
 * This handles both the old r/o tag format and the new result/output tag format
 */
export function parseXML(xml: string): Dataset {
  const results: DatasetItem[] = [];
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");
  
  // Try new format first (result tags)
  let resultElements = xmlDoc.getElementsByTagName('result');
  
  // If no results found with new tags, try old format (r tags) 
  if (resultElements.length === 0) {
    resultElements = xmlDoc.getElementsByTagName('r');
  }
  
  for (let i = 0; i < resultElements.length; i++) {
    const resultElement = resultElements[i];
    
    // Get agent_type
    const agentTypeElement = resultElement.getElementsByTagName('agent_type')[0];
    const agentType = agentTypeElement ? agentTypeElement.textContent || '' : '';
    
    // Get output - try new format first
    let outputElement: Element | null = resultElement.getElementsByTagName('output')[0] || null;
    
    // If not found, try old format
    if (!outputElement) {
      outputElement = resultElement.getElementsByTagName('o')[0] || null;
    }
    
    let outputData: any = '';
    
    if (outputElement) {
      // Check if the output has child elements that would indicate JSON structure
      if (outputElement.children.length > 0) {
        try {
          // Try to reconstruct the JSON from XML structure
          outputData = xmlElementToJson(outputElement);
        } catch (e) {
          // If parsing fails, use the text content
          console.error('Failed to parse XML to JSON:', e);
          outputData = outputElement.textContent || '';
        }
      } else {
        outputData = outputElement.textContent || '';
      }
    }
    
    results.push({
      agent_type: agentType,
      output: outputData
    });
  }
  
  return { results };
}

/**
 * Helper function to convert XML elements back to JSON
 */
function xmlElementToJson(element: Element): any {
  // If it's just text, return the text content
  if (element.children.length === 0) {
    return element.textContent;
  }
  
  // If all children are 'item' elements with 'index' attributes, it's likely an array
  const allItems = Array.from(element.children).every(child => 
    child.tagName === 'item' && child.hasAttribute('index'));
  
  if (allItems) {
    // Create an array with the correct size
    const result: any[] = [];
    Array.from(element.children).forEach(child => {
      const index = parseInt(child.getAttribute('index') || '0', 10);
      result[index] = xmlElementToJson(child);
    });
    return result;
  } else {
    // It's an object
    const result: any = {};
    Array.from(element.children).forEach(child => {
      // Convert XML tag to JSON key (revert the conversion done in jsonToXML)
      const key = child.tagName;
      result[key] = xmlElementToJson(child);
    });
    return result;
  }
}
