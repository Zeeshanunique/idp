'use client';

import { useEffect, useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dataset } from '@/lib/dataset-utils';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DatasetManipulatorProps {
  dataset: Dataset;
  onDatasetUpdated?: (newDataset: Dataset) => void;
}

export default function DatasetManipulator({ dataset, onDatasetUpdated }: DatasetManipulatorProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [apiKeyLoading, setApiKeyLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch API key from the server
    const fetchApiKey = async () => {
      try {
        setApiKeyLoading(true);
        const response = await fetch('/api/config');
        
        if (!response.ok) {
          throw new Error('Failed to fetch API key configuration');
        }
        
        const data = await response.json();
        
        if (data.apiKey) {
          setApiKey(data.apiKey);
          // Store in localStorage as a fallback
          localStorage.setItem('gemini_api_key', data.apiKey);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } else {
          // Fall back to localStorage if server doesn't provide a key
          const savedApiKey = localStorage.getItem('gemini_api_key');
          if (savedApiKey) {
            setApiKey(savedApiKey);
          }
        }
      } catch (e) {
        console.error('Error fetching API key from server:', e);
        // Fall back to localStorage if server request fails
        try {
          const savedApiKey = localStorage.getItem('gemini_api_key');
          if (savedApiKey) {
            setApiKey(savedApiKey);
          }
        } catch (localStorageError) {
          console.error('Failed to load API key from localStorage', localStorageError);
        }
      } finally {
        setApiKeyLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  // Keep this function for manual override if needed
  const handleSaveApiKey = () => {
    try {
      localStorage.setItem('gemini_api_key', apiKey);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save API key');
    }
  };

  const handleUpdateDataset = async () => {
    if (!apiKey || !prompt) {
      setError('Please provide both an API key and a update prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setResult('');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Create a prompt that includes the dataset and the user's instructions
      const datasetJson = JSON.stringify(dataset, null, 2);
      const fullPrompt = `
        You are a data update assistant. I have a dataset in JSON format that I want you to update.
        
        Here is the dataset:
        \`\`\`json
        ${datasetJson}
        \`\`\`
        
        Instructions for update:
        ${prompt}
        
        Please provide the resulting JSON after update. Only return valid JSON that follows the same structure as the input (with "results" array containing objects with "output" and "agent_type" fields), nothing else.
      `;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();
      
      let processedText = text;
      
      // Extract JSON from the response if it's wrapped in markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        processedText = jsonMatch[1];
      }
      
      try {
        const newDataset = JSON.parse(processedText);
        if (onDatasetUpdated && typeof onDatasetUpdated === 'function') {
          onDatasetUpdated(newDataset);
        }
        setResult(JSON.stringify(newDataset, null, 2));
      } catch (jsonError) {
        console.error('Failed to parse AI response as JSON:', jsonError);
        setError('The AI did not return valid JSON. Please try again with a different prompt.');
        setResult(processedText);
      }
    } catch (e: any) {
      console.error('Error during dataset manipulation:', e);
      setError(`Manipulation failed: ${e.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dataset Update</CardTitle>
        <CardDescription>
          Use AI to transform, filter, or update your dataset
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show API key field only if server didn't provide one */}
        {(!apiKey || apiKeyLoading) && (
          <div>
            <label className="block text-sm font-medium mb-1">Google AI API Key</label>
            <div className="flex space-x-2">
              <Input
                type="password"
                placeholder={apiKeyLoading ? "Loading API key..." : "Enter your Google AI API Key"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
                disabled={apiKeyLoading}
              />
              <Button onClick={handleSaveApiKey} disabled={!apiKey || apiKeyLoading}>
                {success ? <Check className="h-4 w-4" /> : 'Save'}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {apiKeyLoading 
                ? "Fetching API key from server configuration..."
                : "Required for dataset manipulation. Get a key at ai.google.dev"}
            </p>
          </div>
        )}

        {/* Show API key status if one was found */}
        {apiKey && !apiKeyLoading && (
          <Alert className="bg-green-900/20 border-green-800">
            <Check className="h-4 w-4 text-green-500" />
            <AlertTitle>API Key Configured</AlertTitle>
            <AlertDescription>
              Your Gemini API key has been successfully configured.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Update Instructions</label>
          <Textarea
            placeholder="Enter instructions for how to update the dataset (e.g., 'Filter results to only include image data', 'Summarize each output to 50 words or less')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div>
            <label className="block text-sm font-medium mb-1">Result</label>
            <div className="bg-gray-900 p-4 rounded-md overflow-auto max-h-[400px]">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleUpdateDataset} 
          disabled={loading || !apiKey || !prompt}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Update Dataset'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
