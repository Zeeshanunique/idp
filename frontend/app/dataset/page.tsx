"use client";

import { useEffect, useState } from 'react';
import DatasetExplorer from '@/components/dataset/DatasetExplorer';
import { Dataset } from '@/lib/dataset-utils';
import api from '@/lib/api'; // Import our API configuration

export default function DatasetPage() {
  const [initialDataset, setInitialDataset] = useState<Dataset | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dataset');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dataset: ${response.status}`);
        }
        
        const data = await response.json();
        setInitialDataset(data);
      } catch (err) {
        console.error('Error fetching dataset:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDataset();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dataset Explorer</h1>
        <p className="text-gray-400 max-w-3xl">
          View, download, and interact with the processed dataset in multiple formats. Use the chat feature to analyze the data using AI.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300"></div>
          <p className="mt-4 text-gray-400">Loading dataset...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border-l-4 border-red-700 text-red-200 p-4 mb-6" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      ) : (
        <DatasetExplorer initialDataset={initialDataset} />
      )}
    </div>
  );
}