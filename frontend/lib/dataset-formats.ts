import { Dataset } from './dataset-utils';

/**
 * Converts a dataset to CSV format
 * Handles nested JSON objects and arrays properly
 */
export function convertToCSV(dataset: Dataset): string {
  if (!dataset.results || dataset.results.length === 0) {
    return 'agent_type,output';
  }
  
  // Create header row (always include agent_type and output)
  const header = 'agent_type,output';
  
  // Create data rows
  const rows = dataset.results.map(item => {
    // Convert output to string if it's not already
    const outputStr = typeof item.output === 'string'
      ? item.output
      : JSON.stringify(item.output, null, 0); // Use compact JSON stringify
    
    // Escape quotes in output by doubling them (CSV standard)
    const escapedOutput = outputStr.replace(/"/g, '""');
    
    // Wrap output in quotes to handle newlines and commas
    return `${item.agent_type},"${escapedOutput}"`;
  });
  
  return [header, ...rows].join('\n');
}

/**
 * Converts a dataset to XML format
 * Handles nested JSON objects and arrays properly
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
      xml += jsonToXML(item.output, 6); // 6 spaces indentation
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
 * Handles complex nested objects and arrays
 */
function jsonToXML(obj: any, indent: number = 0): string {
  const spaces = ' '.repeat(indent);
  let xml = '';
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      xml += `${spaces}<item index="${index}">\n`;
      if (typeof item === 'object' && item !== null) {
        xml += jsonToXML(item, indent + 2);
      } else {
        xml += `${spaces}  ${escapeXML(String(item))}\n`;
      }
      xml += `${spaces}</item>\n`;
    });
  } else if (obj === null) {
    xml += `${spaces}<null/>\n`;
  } else if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      // Convert key to valid XML tag (remove spaces, special chars)
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z_]+/, '_');
      
      if (value === null) {
        xml += `${spaces}<${safeKey} xsi:nil="true"/>\n`;
      } else if (typeof value === 'object') {
        xml += `${spaces}<${safeKey}>\n`;
        xml += jsonToXML(value, indent + 2);
        xml += `${spaces}</${safeKey}>\n`;
      } else {
        xml += `${spaces}<${safeKey}>${escapeXML(String(value))}</${safeKey}>\n`;
      }
    });
  } else {
    // This should not happen if the function is called correctly
    xml += `${spaces}${escapeXML(String(obj))}\n`;
  }
  
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
    
    // Handle quoted CSV properly
    let inQuotes = false;
    let currentField = '';
    const fields = [];
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        // If this is a double quote inside quotes, add a single quote
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          currentField += '"';
          j++; // Skip the next quote
        } else {
          // Toggle the in-quotes flag
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
    
    // Try to parse the output as JSON if it looks like JSON
    if (fields.length >= 2) {
      let output = fields[1];
      
      // Try to parse as JSON if it starts with { or [
      if ((output.trim().startsWith('{') && output.trim().endsWith('}')) || 
          (output.trim().startsWith('[') && output.trim().endsWith(']'))) {
        try {
          output = JSON.parse(output);
        } catch (e) {
          // If parsing fails, keep it as a string
          console.log('Failed to parse JSON in CSV:', e);
        }
      }
      
      results.push({
        agent_type: fields[0],
        output: output
      });
    }
  }
  
  return { results };
}

/**
 * Parse XML text into a Dataset object
 * This is a basic implementation that handles the structure created by convertToXML
 */
export function parseXML(xml: string): Dataset {
  const results: any[] = [];
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");
  
  // Get all result elements
  const resultElements = xmlDoc.getElementsByTagName('result');
  
  for (let i = 0; i < resultElements.length; i++) {
    const resultElement = resultElements[i];
    
    // Get agent_type
    const agentTypeElement = resultElement.getElementsByTagName('agent_type')[0];
    const agentType = agentTypeElement ? agentTypeElement.textContent || '' : '';
    
    // Get output
    const outputElement = resultElement.getElementsByTagName('output')[0];
    let output = '';
    
    if (outputElement) {
      // Check if the output has child elements that would indicate JSON structure
      if (outputElement.children.length > 0) {
        try {
          // Try to reconstruct the JSON from XML structure
          output = xmlElementToJson(outputElement);
        } catch (e) {
          // If parsing fails, use the text content
          output = outputElement.textContent || '';
        }
      } else {
        output = outputElement.textContent || '';
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
