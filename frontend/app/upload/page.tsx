"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import api from '@/lib/api'; // Import our API configuration
import Link from 'next/link';
import { useAuth, SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';

// Add window interface declaration for statusRetryCount
declare global {
  interface Window {
    statusRetryCount?: number;
  }
}

export default function UploadPage() {
  const { isLoaded, userId, sessionId } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('text');
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState('');
  const [uploadStatus, setUploadStatus] = useState<null | {
    status: string;
    message?: string;
    fileId?: string;
    resultUrl?: string;
    result?: any;
  }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10,
      },
    },
  };

  // If authentication is not loaded yet, show a loading state
  if (!isLoaded) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center py-16 px-8 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-bold text-white">Loading...</h2>
        </div>
      </main>
    );
  }

  // If user is not authenticated, show sign-in component
  if (!userId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center py-16 px-8 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-md w-full p-8 bg-gray-800 border border-gray-700 rounded-xl shadow-xl">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Sign In to Upload</h2>
          <p className="text-gray-300 mb-6 text-center">Please sign in to access the document upload functionality</p>
          <div className="flex justify-center">
            <SignIn redirectUrl="/upload" />
          </div>
        </div>
      </main>
    );
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFileName(selectedFile.name);
      setFile(selectedFile);
      setUploadStatus(null); // Reset status when file changes
    }
  };

  // Handle instruction changes
  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInstructions(e.target.value);
  };
  // Poll for status updates
  const pollStatus = async (fileId: string) => {
    try {
      // Ensure we're using the fileId without any extension
      const cleanFileId = fileId.split('.')[0];
      console.log(`Checking status for file ID: ${cleanFileId}`);
      
      // Use fetch for consistent behavior with the Next.js API proxy
      const statusResponse = await fetch(`/api/status/${cleanFileId}`);
      
      if (!statusResponse.ok) {
        throw new Error(`Status check failed with status: ${statusResponse.status}`);
      }
      
      const data = await statusResponse.json();
      
      console.log('Status response:', data);
      setUploadStatus(data);
      
      if (data.status === 'processing') {
        // Continue polling if still processing
        setTimeout(() => pollStatus(cleanFileId), 3000); // Poll every 3 seconds to reduce load
      } else {
        // Done processing
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      // Add retry logic - try up to 3 times with exponential backoff
      if (!window.statusRetryCount) window.statusRetryCount = 0;
      
      if (window.statusRetryCount < 3) {
        window.statusRetryCount++;
        const retryDelay = 1000 * Math.pow(2, window.statusRetryCount);
        console.log(`Retrying in ${retryDelay/1000} seconds... (Attempt ${window.statusRetryCount}/3)`);
        
        setTimeout(() => pollStatus(fileId), retryDelay);
      } else {
        window.statusRetryCount = 0;
        setUploadStatus({
          status: 'error',
          message: 'Failed to check processing status after multiple attempts'
        });
        setIsUploading(false);
      }
    }
  };

  // Upload file to backend
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadStatus({
      status: 'uploading',
      message: 'Uploading file...'
    });
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_type', selectedType);
      formData.append('user_id', userId || 'anonymous'); // Add user ID to associate uploads with user
      if (instructions.trim()) {
        formData.append('instructions', instructions);
      }
      
      console.log(`Uploading ${selectedType} file: ${file.name}`);
      
      // Use fetch directly with the Next.js API route for more reliable handling
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData, // No need to set Content-Type for multipart/form-data with fetch
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }
      
      const response = {
        data: await uploadResponse.json()
      };
      
      const data = response.data;
      
      setUploadStatus({
        status: 'processing',
        message: 'File uploaded, processing...',
        fileId: data.file_id
      });
      
      // Start polling for status
      pollStatus(data.file_id);
      
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadStatus({
        status: 'error',
        message: 'Failed to upload file. Please try again.'
      });
    }
  };

  // Reset the form
  const handleReset = () => {
    setFileName('');
    setFile(null);
    setInstructions('');
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center py-16 px-8 bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Fancy Processing Animation Overlay */}
      <AnimatePresence>
        {isUploading && uploadStatus?.status === 'processing' && (
          <motion.div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gray-900 border border-blue-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className="text-center space-y-6">
                <div className="relative mx-auto w-32 h-32">
                  {/* Spinning outer circle */}
                  <motion.div 
                    className="absolute inset-0 rounded-full border-4 border-blue-500/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                  />
                  
                  {/* Spinning middle circle */}
                  <motion.div 
                    className="absolute inset-2 rounded-full border-4 border-t-blue-400 border-r-transparent border-b-transparent border-l-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                  />
                  
                  {/* Spinning inner circle */}
                  <motion.div 
                    className="absolute inset-4 rounded-full border-4 border-r-indigo-500 border-t-transparent border-b-transparent border-l-transparent"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                  />
                  
                  {/* Pulsing center dot */}
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50" />
                  </motion.div>
                </div>
                
                <motion.h3 
                  className="text-xl font-bold text-white"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Processing {selectedType}
                </motion.h3>
                
                <div className="space-y-2">
                  <p className="text-gray-300">Our AI agents are analyzing your content</p>
                  
                  {/* Processing steps with animations */}
                  <div className="space-y-1 pt-3">
                    {[
                      "Loading document...",
                      "Extracting data structures...",
                      "Analyzing content...",
                      "Generating insights..."
                    ].map((step, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-center space-x-3 text-left"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ 
                          opacity: index < (Math.floor(Date.now() / 1000) % 4) + 1 ? 1 : 0.4,
                          x: index < (Math.floor(Date.now() / 1000) % 4) + 1 ? 0 : -10
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm text-gray-400">{step}</span>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      initial={{ width: "5%" }}
                      animate={{ width: "100%" }}
                      transition={{ 
                        duration: 15,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">This may take a few moments</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        className="z-10 max-w-6xl w-full space-y-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center space-y-6">
          <motion.h1 
            className="text-5xl font-bold text-white"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          >
            Document Intelligence Upload
          </motion.h1>
          <motion.p 
            className="text-xl max-w-3xl mx-auto text-gray-300 px-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Our specialized AI agents process your documents, images, videos, and audio files
            to extract structured information and convert it into usable JSON data.
          </motion.p>
        </div>
        
        {/* Document Type Selection */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {[
            {
              id: 'text',
              title: 'Text Documents',
              description: 'PDFs, CSVs, and web content',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )
            },
            {
              id: 'image',
              title: 'Images',
              description: 'Photos, scans, and documents',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              id: 'video',
              title: 'Videos',
              description: 'Extract speech and transcripts',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              id: 'audio',
              title: 'Audio',
              description: 'Transcribe spoken content',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )
            }
          ].map((type) => (
            <motion.div 
              key={type.id}
              variants={itemVariants}
              className="flex flex-col"
            >
              <Card 
                className={`bg-gray-800 border border-opacity-20 shadow-xl h-full transition-all duration-300 cursor-pointer overflow-hidden 
                  ${selectedType === type.id ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-gray-700 hover:border-gray-500'}`}
                onClick={() => setSelectedType(type.id)}
              >
                <div className="absolute top-0 left-0 w-full h-1.5">
                  <div 
                    className={`h-full ${selectedType === type.id ? 'bg-blue-500' : 'bg-transparent'} 
                    transition-all duration-500 ${selectedType === type.id ? 'w-full' : 'w-0'}`}
                  ></div>
                </div>
                <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center text-center">
                  <div className="text-blue-400">
                    {type.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-white mb-3">{type.title}</CardTitle>
                  <CardDescription className="text-gray-400">{type.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Upload Area */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="bg-gray-800 border-gray-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Upload {selectedType === 'text' ? 'Document' : selectedType === 'image' ? 'Image' : selectedType === 'video' ? 'Video' : 'Audio'}</CardTitle>
              <CardDescription className="text-gray-400">
                {selectedType === 'text' && "Upload PDFs, CSVs, or text files to extract structured information"}
                {selectedType === 'image' && "Upload images to perform OCR and extract text content"}
                {selectedType === 'video' && "Upload videos to transcribe speech and extract information"}
                {selectedType === 'audio' && "Upload audio files to transcribe and analyze spoken content"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <motion.div 
                className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 transition-colors"
                whileHover={{ scale: 1.01, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              >
                <div className="space-y-6">
                  <motion.svg 
                    className="mx-auto h-16 w-16 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      repeat: Infinity, 
                      repeatType: "reverse", 
                      duration: 2.5,
                      ease: "easeInOut"
                    }}
                  >
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                  {fileName ? (
                    <div className="flex flex-col space-y-2 items-center">
                      <span className="text-white text-lg">{fileName}</span>
                      <button 
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                        onClick={() => {
                          setFileName('');
                          setFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex text-base justify-center text-gray-400">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-500 hover:text-blue-400 focus-within:outline-none">
                          <span>Upload a file</span>
                          <input 
                            id="file-upload" 
                            ref={fileInputRef}
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-sm text-gray-400">
                        {selectedType === 'text' && "PDF, DOCX, TXT, CSV up to 20MB"}
                        {selectedType === 'image' && "JPG, PNG, GIF, TIFF, WEBP up to 15MB"}
                        {selectedType === 'video' && "MP4, MOV, WEBM up to 200MB"}
                        {selectedType === 'audio' && "MP3, WAV, FLAC, OGG up to 50MB"}
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="instructions" className="block text-base font-medium text-gray-300 mb-3">Processing Instructions (Optional)</label>
                  <textarea 
                    id="instructions" 
                    name="instructions" 
                    rows={4} 
                    className="mt-1 block w-full px-4 py-3 text-base border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={
                      selectedType === 'text' ? "e.g., Extract all dates, names, and financial figures from this document" :
                      selectedType === 'image' ? "e.g., Focus on extracting text from tables and forms" :
                      selectedType === 'video' ? "e.g., Identify speakers and create timestamps for key topics" :
                      "e.g., Transcribe all speakers and identify questions vs answers"
                    }
                    value={instructions}
                    onChange={handleInstructionChange}
                  ></textarea>
                </div>
              </div>
              
              {/* Processing Status */}
              {uploadStatus && (
                <div className={`p-4 rounded-lg ${
                  uploadStatus.status === 'error' ? 'bg-red-900/40 border border-red-700' : 
                  uploadStatus.status === 'completed' ? 'bg-green-900/40 border border-green-700' : 
                  'bg-blue-900/40 border border-blue-700'
                }`}>
                  <h3 className="text-lg font-medium text-white mb-2">
                    {uploadStatus.status === 'error' ? 'Error' : 
                     uploadStatus.status === 'uploading' ? 'Uploading' :
                     uploadStatus.status === 'processing' ? 'Processing' : 
                     'Completed'}
                  </h3>
                  
                  <p className="text-gray-300">{uploadStatus.message}</p>
                  
                  {uploadStatus.status === 'completed' && uploadStatus.result && (
                    <div className="mt-4">
                      <h4 className="text-md font-semibold text-white mb-2">Results:</h4>
                      <div className="bg-gray-900 p-3 rounded overflow-auto max-h-60">
                        <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                            {uploadStatus.result.results && uploadStatus.result.results.length > 0 ? (
                            JSON.stringify(
                              { 
                              results: uploadStatus.result.results.map((item: { output: any; agent_type: string }) => ({
                                output: item.output,
                                agent_type: item.agent_type
                              }))
                              }, 
                              null, 
                              2
                            )
                            ) : (
                            JSON.stringify(uploadStatus.result, null, 2)
                            )}
                        </pre>
                      </div>
                      
                      {uploadStatus.resultUrl && (
                        <a 
                          href={uploadStatus.resultUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          Download Results
                        </a>
                      )}
                      
                      <Link href="/dataset">
                        <button 
                          className="inline-block mt-4 ml-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                          Explore Dataset
                        </button>
                      </Link>
                      
                      <button
                        onClick={handleReset}
                        className="inline-block mt-4 ml-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                      >
                        Process Another File
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-2 pb-8 px-8">
              <Button 
                className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 group relative overflow-hidden transition-all duration-300"
                onClick={handleUpload}
                disabled={!file || isUploading || (uploadStatus?.status === 'completed')}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {uploadStatus?.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      Process {selectedType === 'text' ? 'Document' : selectedType === 'image' ? 'Image' : selectedType === 'video' ? 'Video' : 'Audio'}
                    </>
                  )}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-shimmer"></span>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
        
        {/* How It Works */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Upload",
                desc: "Upload your documents, images, videos, or audio files",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )
              },
              {
                title: "AI Processing",
                desc: "Our specialized agents analyze your content",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                title: "Data Extraction",
                desc: "Content is transformed into structured JSON",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                title: "Review Results",
                desc: "Access your processed data in clean format",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ].map((step, index) => (
              <motion.div 
                key={index}
                className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-lg"
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)" }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <div className="text-blue-400 mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Agent Information */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-10">Our Document Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Text Data Specialist",
                desc: "Processes and extracts structured JSON from uploaded text files like PDFs, CSVs, and web content",
                capabilities: ["Data extraction", "Table recognition", "Key-value parsing", "Format conversion"]
              },
              {
                title: "OCR Image Analyst",
                desc: "Uses OCR to extract structured information from image files and convert it into JSON format",
                capabilities: ["Optical character recognition", "Form detection", "Layout analysis", "Handwriting recognition"]
              },
              {
                title: "Video-to-Text Transcriber",
                desc: "Analyzes videos to extract spoken content and structure it into JSON format",
                capabilities: ["Speech recognition", "Speaker diarization", "Timestamp generation", "Content summarization"]
              },
              {
                title: "Audio Transcriber",
                desc: "Transcribes audio content and converts important information into structured JSON",
                capabilities: ["Voice recognition", "Tone analysis", "Keyword extraction", "Conversation structuring"]
              }
            ].map((agent, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-700"
              >
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-4 text-white">{agent.title}</h3>
                  <p className="text-gray-300 mb-6">{agent.desc}</p>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Capabilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {agent.capabilities.map((capability, idx) => (
                        <span 
                          key={idx}
                          className="bg-blue-900 bg-opacity-30 text-blue-300 text-sm px-3 py-1 rounded-full"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}