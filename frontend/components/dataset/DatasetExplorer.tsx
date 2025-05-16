"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DatasetDisplay from './DatasetDisplay';
import DatasetChat from './DatasetChat';
import DatasetManipulator from './DatasetManipulator';
import { Dataset } from '@/lib/dataset-utils';

interface DatasetExplorerProps {
  initialDataset?: Dataset;
}

export default function DatasetExplorer({ initialDataset }: DatasetExplorerProps) {
  const [dataset, setDataset] = useState<Dataset | null>(initialDataset || null);
  const [loading, setLoading] = useState(!initialDataset);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>('view');

  // Fetch dataset if not provided
  useEffect(() => {
    const fetchDataset = async () => {
      if (initialDataset) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/dataset');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dataset: ${response.status}`);
        }
        
        const data = await response.json();
        setDataset(data);
      } catch (err) {
        console.error('Error fetching dataset:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Try to load API key from localStorage
    try {
      const savedApiKey = localStorage.getItem('gemini_api_key');
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
    } catch (e) {
      console.error('Failed to load API key from localStorage');
    }

    fetchDataset();
  }, [initialDataset]);

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300"></div>
          <p className="text-gray-400">Loading dataset...</p>
        </div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="w-full bg-red-900/30 text-red-200 p-6 rounded-xl">
        <h3 className="text-xl font-bold mb-2">Error Loading Dataset</h3>
        <p>{error || 'Failed to load dataset'}</p>
        <p className="mt-4">
          Please make sure the backend server is running and the dataset is available.
        </p>
      </div>
    );
  }

  const handleDatasetUpdated = (newDataset: Dataset) => {
    setDataset(newDataset);
  };

  return (
    <div className="w-full space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="view">View Dataset</TabsTrigger>
          <TabsTrigger value="chat">Chat with Dataset</TabsTrigger>
          <TabsTrigger value="manipulate">Update Dataset</TabsTrigger>
        </TabsList>
        
        <TabsContent value="view" className="mt-0">
          <DatasetDisplay dataset={dataset} />
        </TabsContent>
        
        <TabsContent value="chat" className="mt-0">
          <DatasetChat dataset={dataset} apiKey={apiKey} />
        </TabsContent>

        <TabsContent value="manipulate" className="mt-0">
          <DatasetManipulator 
            dataset={dataset} 
            onDatasetUpdated={handleDatasetUpdated} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}