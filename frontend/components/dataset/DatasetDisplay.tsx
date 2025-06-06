"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dataset, downloadDataset } from "@/lib/dataset-utils";
import { Badge } from "@/components/ui/badge";

interface DatasetDisplayProps {
  dataset: Dataset;
}

export default function DatasetDisplay({ dataset }: DatasetDisplayProps) {
  const [activeFormat, setActiveFormat] = useState<string>('extracted');
  
  // Get audio file properties from metadata
  const getAudioDetails = (data: any): any => {
    if (!data?.transcription?.metadata?.audio_info) return null;
    
    const info = data.transcription.metadata.audio_info;
    return {
      channels: info.channels || 'Unknown',
      duration: info.duration ? `${Math.round(info.duration * 10) / 10} seconds` : 'Unknown',
      sampleRate: info.framerate ? `${info.framerate} Hz` : 'Unknown',
      format: data.metadata?.file_extension || 'Unknown'
    };
  };
  
  // Format the dataset based on the active format
  const getFormattedDataset = () => {
    // Helper to remove metadata from objects
    const removeMetadata = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      if (Array.isArray(obj)) {
        return obj.map((item: any): any => removeMetadata(item));
      }
      
      const newObj = {...obj};
      if (newObj.metadata) delete newObj.metadata;
      
      // Also remove metadata from nested results
      if (newObj.results && Array.isArray(newObj.results)) {
        newObj.results = newObj.results.map((result: any) => {
          if (result && typeof result === 'object' && result.metadata) {
            const cleanResult = {...result};
            delete cleanResult.metadata;
            return cleanResult;
          }
          return result;
        });
      }
      
      return newObj;
    };
    
    switch (activeFormat) {
      case 'json':
        // Create a clean copy of dataset without metadata
        const cleanDataset = {
          ...dataset,
          results: dataset.results.map((item: any) => {
            let output = item.output;
            if (typeof output === 'string') {
              try {
                const parsed = JSON.parse(output);
                output = removeMetadata(parsed);
                return { ...item, output };
              } catch (e) {
                return item; // Keep as is if not valid JSON
              }
            } else if (typeof output === 'object') {
              output = removeMetadata(output);
              return { ...item, output };
            }
            return item;
          })
        };
        return JSON.stringify(cleanDataset, null, 2);
      case 'csv':
        return 'agent_type,output\n' + 
          dataset.results.map((item: any) => {
            let output = item.output;
            if (typeof output === 'object') {
              // Remove metadata before stringifying
              output = removeMetadata(output);
            }
            const outputStr = typeof output === 'string' 
              ? output 
              : JSON.stringify(output);
            return `${item.agent_type},"${outputStr.replace(/"/g, '""')}"`;
          }).join('\n');
      case 'xml':
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<dataset>\n';
        dataset.results.forEach((item: any) => {
          let output = item.output;
          
          // Remove metadata if it's an object
          if (typeof output === 'object' && output !== null) {
            const cleanOutput = {...output};
            if (cleanOutput.metadata) delete cleanOutput.metadata;
            output = cleanOutput;
          } else if (typeof output === 'string') {
            try {
              // Try to parse and remove metadata if it's JSON string
              const parsed = JSON.parse(output);
              if (parsed.metadata) {
                const cleanParsed = {...parsed};
                delete cleanParsed.metadata;
                output = JSON.stringify(cleanParsed);
              }
            } catch (e) {
              // If it's not valid JSON, keep as is
            }
          }
          
          const outputStr = typeof output === 'string'
            ? output
            : JSON.stringify(output);
          
          xml += `  <r>\n    <agent_type>${item.agent_type}</agent_type>\n    <o>${outputStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</o>\n  </r>\n`;
        });
        xml += '</dataset>';
        return xml;
      case 'extracted':
        return null; // This format is handled separately in the JSX
      default:
        return JSON.stringify(dataset, null, 2);
    }
  };

  // Parse and extract meaningful data from dataset items
  const extractStructuredData = (item: any): any => {
    try {
      // If it's already an object, use it directly
      const data = typeof item.output === 'string' 
        ? JSON.parse(item.output) 
        : item.output;
      
      // Remove metadata from the data object
      const dataWithoutMetadata = { ...data };
      if (dataWithoutMetadata.metadata) {
        delete dataWithoutMetadata.metadata;
      }
      
      // Extract specific data based on type
      if (item.agent_type.includes('text')) {
        const result = data.text_processing_result || dataWithoutMetadata;
        return result.metadata ? { ...result, metadata: undefined } : result;
      }
      if (item.agent_type.includes('image')) {
        const result = data.image_processing_result || dataWithoutMetadata;
        return result.metadata ? { ...result, metadata: undefined } : result;
      }
      if (item.agent_type.includes('audio')) {
        // Special handling for audio files with transcription data
        if (data.transcription) {
          // Keep the transcription data and metadata if available
          return {
            transcription: data.transcription,
            analysis: data.analysis,
            metadata: data.metadata
          };
        }
        const result = data.audio_processing_result || dataWithoutMetadata;
        return result.metadata ? { ...result, metadata: undefined } : result;
      }
      return dataWithoutMetadata;
    } catch (error) {
      console.error("Error parsing data:", error);
      return { error: "Could not parse data", raw: item.output };
    }
  };

  // Recursively render structured data
  const renderStructuredData = (data: any) => {
    if (!data) return <div className="text-gray-400">No data</div>;

    // Handle special case for audio transcription
    if (data.transcription) {
      const audioDetails = getAudioDetails(data);
      
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-1">
              Transcription
            </h3>
            {data.transcription.text ? (
              <div className="bg-gray-800/50 p-3 rounded-md border border-gray-700 whitespace-pre-wrap font-medium">
                <div className="mb-2">
                  <Badge variant="outline" className="bg-green-900/30 text-green-300 border-green-700">
                    Transcribed
                  </Badge>
                </div>
                <div className="mt-2 text-white leading-relaxed">
                  {data.transcription.text}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 p-3 rounded-md border border-gray-700">
                <div className="mb-2">
                  <Badge variant="outline" className="bg-amber-900/30 text-amber-300 border-amber-700">
                    No Transcription
                  </Badge>
                </div>
                <div className="mt-2 text-amber-300">
                  {data.transcription.metadata?.error || "Transcription unavailable"}
                </div>
              </div>
            )}
          </div>

          {audioDetails && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-1">
                Audio Details
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(audioDetails).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-start">
                    <span className="text-gray-400 capitalize mr-2">{key}:</span>
                    <span className="text-gray-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.analysis && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-1">
                Analysis
              </h3>
              <div className="pl-4 border-l-2 border-gray-700">
                {data.analysis.description && (
                  <div className="mb-2">
                    <div className="flex items-start">
                      <span className="text-gray-400 capitalize mr-2">Description:</span>
                      <div className="text-gray-300">{data.analysis.description}</div>
                    </div>
                  </div>
                )}
                {data.analysis.note && (
                  <div className="mb-2">
                    <div className="flex items-start">
                      <span className="text-gray-400 capitalize mr-2">Note:</span>
                      <div className="text-gray-300">{data.analysis.note}</div>
                    </div>
                  </div>
                )}
                {data.analysis.recommendations && data.analysis.recommendations.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-start">
                      <span className="text-gray-400 capitalize mr-2">Recommendations:</span>
                      <div className="text-gray-300">
                        <ul className="list-disc pl-5 space-y-1">
                          {data.analysis.recommendations.map((rec: string, i: number) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {data.metadata && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Audio File Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(data.metadata).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-start">
                    <span className="text-gray-500 capitalize mr-2">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-300">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Handle special case for notes and similar structured data
    if (data.notes) {
      return (
        <div className="space-y-4">
          {Object.entries(data.notes).map(([key, value]: [string, any]) => (
            <div key={key} className="space-y-2">
              <h3 className="text-lg font-medium capitalize text-white border-b border-gray-700 pb-1">
                {key.replace(/_/g, ' ')}
              </h3>
              {renderDataValue(value)}
            </div>
          ))}
        </div>
      );
    }
    
    // Default rendering for other structured data
    return (
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]: [string, any]) => {
          // Skip metadata and any other metadata-like fields
          if (key === 'metadata' || key === 'file_metadata') return null;
          
          return (
            <div key={key} className="space-y-2">
              <h3 className="text-lg font-medium capitalize text-white border-b border-gray-700 pb-1">
                {key.replace(/_/g, ' ')}
              </h3>
              {renderDataValue(value)}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Render different types of values
  const renderDataValue = (value: any) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return <div className="text-gray-400">Empty list</div>;
      
      // Check if array contains objects with specific structures
      if (typeof value[0] === 'object' && value[0] !== null) {
        return (
          <div className="grid grid-cols-1 gap-2 mt-2">
            {value.map((item, i) => (
              <div key={i} className="bg-gray-800/50 p-3 rounded-md border border-gray-700">
                {Object.entries(item).map(([itemKey, itemValue]: [string, any]) => (
                  <div key={itemKey} className="flex flex-col md:flex-row md:items-center mb-2 last:mb-0">
                    <span className="text-gray-400 capitalize mr-2 md:w-1/3">
                      {itemKey.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-white md:w-2/3">{String(itemValue)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
      
      // Regular array of simple values
      return (
        <ul className="list-disc pl-5 space-y-1">
          {value.map((item, i) => (
            <li key={i} className="text-gray-300">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </li>
          ))}
        </ul>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="pl-4 border-l-2 border-gray-700">
          {Object.entries(value).map(([subKey, subValue]: [string, any]) => (
            <div key={subKey} className="mb-2">
              <div className="flex items-start">
                <span className="text-gray-400 capitalize mr-2">
                  {subKey.replace(/_/g, ' ')}:
                </span>
                <div className="text-gray-300">
                  {typeof subValue === 'object' && subValue !== null 
                    ? renderDataValue(subValue) 
                    : String(subValue)}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // Simple value
    return <div className="text-gray-300">{String(value)}</div>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dataset Viewer</CardTitle>
        <CardDescription>
          View and download the dataset in multiple formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeFormat} onValueChange={setActiveFormat} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="csv">CSV</TabsTrigger>
            <TabsTrigger value="xml">XML</TabsTrigger>
          </TabsList>
          
          <TabsContent value="extracted" className="mt-0">
            <div className="space-y-6">
              {dataset.results.map((item: any, index: number) => {
                const structuredData = extractStructuredData(item);
                return (
                  <div key={index} className="bg-gray-900 rounded-md overflow-hidden border border-gray-800">
                    <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={
                          item.agent_type.includes('text') ? 'bg-blue-900/30 text-blue-300 border-blue-700' :
                          item.agent_type.includes('image') ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700' :
                          item.agent_type.includes('audio') ? 'bg-amber-900/30 text-amber-300 border-amber-700' :
                          'bg-purple-900/30 text-purple-300 border-purple-700'
                        }>
                          {item.agent_type}
                        </Badge>
                        
                        {/* Display transcription status for audio files */}
                        {item.agent_type.includes('audio') && (
                          <>
                            {structuredData?.transcription?.text ? (
                              <Badge variant="outline" className="bg-green-900/30 text-green-300 border-green-700 ml-2">
                                Transcribed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-900/30 text-amber-300 border-amber-700 ml-2">
                                No Transcription
                              </Badge>
                            )}
                          </>
                        )}
                        
                        {/* Display filename if available */}
                        {structuredData?.metadata?.file_name && (
                          <span className="text-sm text-gray-400 ml-2">
                            {structuredData.metadata.file_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      {renderStructuredData(structuredData)}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="json" className="mt-0">
            <div className="bg-gray-900 p-4 rounded-md overflow-auto max-h-[400px]">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap">{getFormattedDataset()}</pre>
            </div>
          </TabsContent>
          
          <TabsContent value="csv" className="mt-0">
            <div className="bg-gray-900 p-4 rounded-md overflow-auto max-h-[400px]">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap">{getFormattedDataset()}</pre>
            </div>
          </TabsContent>
          
          <TabsContent value="xml" className="mt-0">
            <div className="bg-gray-900 p-4 rounded-md overflow-auto max-h-[400px]">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap">{getFormattedDataset()}</pre>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex flex-wrap gap-3 mt-4">
          <Button 
            variant="outline" 
            onClick={() => downloadDataset(dataset, 'json')}
          >
            Download JSON
          </Button>
          <Button 
            variant="outline" 
            onClick={() => downloadDataset(dataset, 'csv')}
          >
            Download CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => downloadDataset(dataset, 'xml')}
          >
            Download XML
          </Button>
          <Button 
            variant="outline" 
            onClick={() => downloadDataset(dataset, 'txt')}
          >
            Download TXT
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
