"use client";

import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dataset } from "@/lib/dataset-utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface DatasetChatProps {
  dataset: Dataset;
  apiKey?: string;
}

export default function DatasetChat({ dataset, apiKey }: DatasetChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you analyze and query the dataset. What would you like to know about it?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || '');
  const [keySet, setKeySet] = useState(!!apiKey);
  const [apiKeyLoading, setApiKeyLoading] = useState<boolean>(true);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch API key from the server
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        // Skip if we already have an API key from props
        if (apiKey) {
          setApiKeyInput(apiKey);
          setKeySet(true);
          setApiKeyLoading(false);
          return;
        }

        setApiKeyLoading(true);
        const response = await fetch('/api/config');
        
        if (!response.ok) {
          throw new Error('Failed to fetch API key configuration');
        }
        
        const data = await response.json();
        
        if (data.apiKey) {
          setApiKeyInput(data.apiKey);
          setKeySet(true);
          // Store in localStorage as a fallback
          try {
            localStorage.setItem('gemini_api_key', data.apiKey);
          } catch (e) {
            console.error('Failed to store API key');
          }
        } else {
          // Fall back to localStorage if server doesn't provide a key
          try {
            const savedApiKey = localStorage.getItem('gemini_api_key');
            if (savedApiKey) {
              setApiKeyInput(savedApiKey);
              setKeySet(true);
            }
          } catch (e) {
            console.error('Failed to load API key from localStorage');
          }
        }
      } catch (e) {
        console.error('Error fetching API key from server:', e);
        // Fall back to localStorage
        try {
          const savedApiKey = localStorage.getItem('gemini_api_key');
          if (savedApiKey) {
            setApiKeyInput(savedApiKey);
            setKeySet(true);
          }
        } catch (localStorageError) {
          console.error('Failed to load API key from localStorage', localStorageError);
        }
      } finally {
        setApiKeyLoading(false);
      }
    };

    fetchApiKey();
  }, [apiKey]);

  // Keep this function for manual override if needed
  const saveApiKey = () => {
    if (apiKeyInput.trim()) {
      setKeySet(true);
      try {
        localStorage.setItem('gemini_api_key', apiKeyInput);
      } catch (e) {
        console.error('Failed to store API key');
      }
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || loading || !keySet) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setInput('');
    setError(null);

    try {
      // Initialize the Google Generative AI with the API key
      const genAI = new GoogleGenerativeAI(apiKeyInput);
      
      // Create the prompt for the AI - limit dataset size if needed
      let datasetJson;
      try {
        // Limit dataset size if it's very large
        const simplifiedDataset = {
          ...dataset,
          results: dataset.results?.slice(0, 10) || [] // Only include first 10 results if array is large
        };
        datasetJson = JSON.stringify(simplifiedDataset, null, 2);
      } catch (jsonError) {
        console.error('Error stringifying dataset:', jsonError);
        datasetJson = '{"error": "Dataset too large to process"}';
      }
      
      const prompt = `
        You are a helpful assistant that can analyze and provide insights about a dataset.
        Here is the current dataset in JSON format:
        \`\`\`json
        ${datasetJson}
        \`\`\`

        The user's question is: "${input}"
        
        Answer their question based on the dataset. If they ask for modifications to the dataset,
        explain how it could be modified but note that you cannot directly modify the dataset.
      `;
      
      // Get a response from Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        // Add the response to the messages
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (modelError: any) {
        console.error('Specific Gemini API error:', modelError);
        
        // Provide more specific error messages
        if (modelError.message?.includes('API key')) {
          setError('Invalid API key. Please check your Gemini API key and try again.');
        } else if (modelError.message?.includes('quota') || modelError.message?.includes('rate limit')) {
          setError('API quota exceeded. Please try again later or check your Gemini API usage limits.');
        } else if (modelError.message?.includes('content filtered')) {
          setError('Your request was filtered by the AI content policy. Please modify your question and try again.');
        } else {
          setError(`Failed to get a response from the AI: ${modelError.message || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Error querying Generative AI:', err);
      setError('Failed to get a response from the AI. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="w-full flex flex-col h-[600px] bg-gray-900 border border-gray-800 shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="bg-gray-800 border-b border-gray-700 pb-4">
        <div className="flex items-center">
          <div className="mr-3 bg-blue-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <CardTitle className="text-white text-xl">Dataset Chat Assistant</CardTitle>
            <CardDescription className="text-gray-400">
              Ask questions about the dataset or request analysis
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      {apiKeyLoading ? (
        <CardContent className="flex-grow overflow-hidden flex flex-col">
          <div className="text-center flex-grow flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-400">Loading API configuration...</p>
          </div>
        </CardContent>
      ) : !keySet ? (
        <CardContent className="flex-grow overflow-hidden flex flex-col">
          <div className="text-center flex-grow flex flex-col items-center justify-center space-y-6 p-6">
            <div className="bg-blue-600/10 p-6 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <p className="text-gray-300 font-medium text-lg">
              To use the chat assistant, you need a Google Generative AI (Gemini) API key.
            </p>
            <div className="flex w-full max-w-md space-x-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="flex-grow rounded-lg px-4 py-3 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Button onClick={saveApiKey} className="bg-blue-600 hover:bg-blue-700 transition-colors">Save</Button>
            </div>
            <p className="text-sm text-gray-500 max-w-md">
              Your API key is stored locally in your browser and is only used for this application.
            </p>
          </div>
        </CardContent>
      ) : (
        <>
          <CardContent className="flex-grow overflow-hidden p-0">
            <div className="h-full overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-900 to-gray-950">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  } items-end space-x-2`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M12 8V4m0 4 3-3m-3 3-3-3"></path>
                        <path d="M20.5 10.5v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-7.5"></path>
                        <path d="M12 12v8"></path>
                        <rect x="2" y="10.5" width="20" height="2" rx="1"></rect>
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                        : 'bg-gray-800 text-gray-200 border border-gray-700'
                    } transition-all`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start items-end space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M12 8V4m0 4 3-3m-3 3-3-3"></path>
                      <path d="M20.5 10.5v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-7.5"></path>
                      <path d="M12 12v8"></path>
                      <rect x="2" y="10.5" width="20" height="2" rx="1"></rect>
                    </svg>
                  </div>
                  <div className="max-w-[80%] rounded-2xl p-4 bg-gray-800 text-gray-200 border border-gray-700 shadow-lg">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                      <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-900/30 text-red-200 p-4 rounded-xl text-sm border border-red-700/50 shadow-lg mx-auto max-w-lg">
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-800 p-4 bg-gray-800">
            <div className="flex w-full space-x-3 items-end">
              <div className="flex-grow relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about the dataset..."
                  className="w-full rounded-xl px-4 py-3 bg-gray-700 border border-gray-600 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows={1}
                  disabled={loading}
                  style={{ minHeight: '50px', maxHeight: '120px' }}
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 h-[50px] transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    <span>Sending</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}