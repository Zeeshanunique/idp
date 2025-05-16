"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dataset, downloadDataset } from "@/lib/dataset-utils";

interface DatasetDisplayProps {
  dataset: Dataset;
}

export default function DatasetDisplay({ dataset }: DatasetDisplayProps) {
  const [activeFormat, setActiveFormat] = useState<string>('json');
  
  // Format the dataset based on the active format
  const getFormattedDataset = () => {
    switch (activeFormat) {
      case 'json':
        return JSON.stringify(dataset, null, 2);
      case 'csv':
        return 'agent_type,output\n' + 
          dataset.results.map(item => `${item.agent_type},"${item.output.replace(/"/g, '""')}"`).join('\n');
      case 'xml':
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<dataset>\n';
        dataset.results.forEach(item => {
          xml += `  <result>\n    <agent_type>${item.agent_type}</agent_type>\n    <output>${item.output.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</output>\n  </result>\n`;
        });
        xml += '</dataset>';
        return xml;
      default:
        return JSON.stringify(dataset, null, 2);
    }
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
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="csv">CSV</TabsTrigger>
            <TabsTrigger value="xml">XML</TabsTrigger>
          </TabsList>
          
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