import { saveAs } from 'file-saver';

export interface DatasetItem {
  output: string;
  agent_type: string;
}

export interface Dataset {
  results: DatasetItem[];
}

// Convert dataset to CSV format
export function datasetToCsv(dataset: Dataset): string {
  // Create CSV header
  let csv = 'agent_type,output\n';
  
  // Add each row
  dataset.results.forEach(item => {
    // Escape quotes in output and wrap in quotes to handle newlines properly
    const escapedOutput = `"${item.output.replace(/"/g, '""')}"`;
    csv += `${item.agent_type},${escapedOutput}\n`;
  });
  
  return csv;
}

// Convert dataset to plain text format
export function datasetToText(dataset: Dataset): string {
  let text = '';
  
  dataset.results.forEach((item, index) => {
    text += `--- Result ${index + 1} ---\n`;
    text += `Agent Type: ${item.agent_type}\n`;
    text += `Output:\n${item.output}\n\n`;
  });
  
  return text;
}

// Convert dataset to XML format
export function datasetToXml(dataset: Dataset): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<dataset>\n';
  
  dataset.results.forEach(item => {
    xml += '  <result>\n';
    xml += `    <agent_type>${escapeXml(item.agent_type)}</agent_type>\n`;
    xml += `    <output>${escapeXml(item.output)}</output>\n`;
    xml += '  </result>\n';
  });
  
  xml += '</dataset>';
  return xml;
}

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Download dataset in specified format
export function downloadDataset(dataset: Dataset, format: 'json' | 'csv' | 'xml' | 'txt'): void {
  let content: string;
  let filename: string;
  let type: string;
  
  switch (format) {
    case 'json':
      content = JSON.stringify(dataset, null, 2);
      filename = 'dataset.json';
      type = 'application/json';
      break;
    case 'csv':
      content = datasetToCsv(dataset);
      filename = 'dataset.csv';
      type = 'text/csv;charset=utf-8';
      break;
    case 'xml':
      content = datasetToXml(dataset);
      filename = 'dataset.xml';
      type = 'application/xml';
      break;
    case 'txt':
      content = datasetToText(dataset);
      filename = 'dataset.txt';
      type = 'text/plain';
      break;
  }
  
  const blob = new Blob([content], { type });
  saveAs(blob, filename);
}