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
    <main className="flex min-h-screen flex-col items-center pt-6 pb-12 px-4 md:px-8 bg-[#0F172A] relative overflow-hidden">
      {/* Modern subtle noise texture overlay */}
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-[url('/noise.svg')] opacity-[0.015] pointer-events-none mix-blend-overlay"></div>
      
      {/* Modern sleek gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1120] via-[#131B2E] to-[#1E293B] opacity-95 pointer-events-none"></div>
      
      {/* Modern mesh gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-sky-400/5 via-transparent to-transparent opacity-90 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent opacity-80 pointer-events-none"></div>
      
      {/* Sleek geometric accents */}
      <div className="absolute top-[10%] right-[10%] w-40 h-40 border border-sky-500/5 rounded-full transform rotate-45 hidden lg:block"></div>
      <div className="absolute bottom-[15%] left-[10%] w-60 h-60 border border-indigo-500/5 rounded-full transform -rotate-12 hidden lg:block"></div>
      
      {/* Modern glow effects */}
      <motion.div 
        className="absolute top-20 right-20 md:right-40 w-[25rem] h-[25rem] bg-sky-400/5 rounded-full blur-[100px]"
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.05, 1],
        }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      ></motion.div>
      
      <motion.div 
        className="absolute -bottom-20 left-10 md:left-40 w-[35rem] h-[35rem] bg-indigo-500/5 rounded-full blur-[120px]"
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.03, 1],
        }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      ></motion.div>
    
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:50px_50px] opacity-[0.01] pointer-events-none"></div>
      
      {/* Modern floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div 
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0, 0.8, 0],
              scale: [0, Math.random() * 2 + 1, 0]
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 8,
            }}
          />
        ))}
      </div>
      
      {/* Enhanced Document Processing Visualization Overlay */}
      <AnimatePresence>
        {isUploading && uploadStatus?.status === 'processing' && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <motion.div 
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400/40 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -100, -200],
                    x: [0, Math.random() * 40 - 20],
                    opacity: [0, 0.8, 0],
                    scale: [0, 1.5, 0]
                  }}
                  transition={{
                    duration: 4 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                  }}
                />
              ))}
            </div>
            
            {/* Radial gradient background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-gray-900/40 to-black/60"></div>
            
            <motion.div 
              className="bg-gray-900/90 border border-blue-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl backdrop-blur-md relative overflow-hidden"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
            >
              {/* Inner glow effects */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
              
              <div className="text-center space-y-6 relative z-10">
                <div className="relative mx-auto w-40 h-40">
                  {/* Document transformation visualization */}
                  <div className="absolute inset-4 flex items-center justify-center perspective-1000">
                    {/* Original document - fades out */}
                    <motion.div
                      className="absolute w-20 h-28 bg-gray-200 rounded-md flex items-center justify-center shadow-lg"
                      animate={{
                        opacity: [1, 0],
                        rotateY: [0, 90],
                        z: [0, -100],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        repeatDelay: 1,
                        ease: "easeInOut"
                      }}
                    >
                      {selectedType === 'text' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : selectedType === 'image' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : selectedType === 'video' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      )}
                    </motion.div>
                    
                    {/* Processing wave - moves from left to right */}
                    <motion.div
                      className="absolute w-10 h-28 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent blur-md"
                      animate={{
                        x: [-100, 100],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Code lines that appear during processing */}
                    <motion.div
                      className="absolute inset-0 flex flex-col items-start justify-center overflow-hidden opacity-50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 3, delay: 1.5 }}
                    >
                      <div className="h-1 w-16 bg-blue-400/50 rounded mb-1"></div>
                      <div className="h-1 w-12 bg-indigo-400/50 rounded mb-1"></div>
                      <div className="h-1 w-20 bg-blue-400/50 rounded mb-1"></div>
                      <div className="h-1 w-8 bg-indigo-400/50 rounded mb-1"></div>
                      <div className="h-1 w-14 bg-blue-400/50 rounded mb-1"></div>
                    </motion.div>
                    
                    {/* Processed document - JSON result - fades in */}
                    <motion.div
                      className="absolute w-20 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center shadow-lg"
                      initial={{ opacity: 0, rotateY: -90, z: -100 }}
                      animate={{
                        opacity: [0, 1],
                        rotateY: [-90, 0],
                        z: [-100, 0],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        delay: 1.5,
                        repeatDelay: 1,
                        ease: "easeInOut"
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </motion.div>
                  </div>
                  
                  {/* Circular processing indicators */}
                  <motion.div 
                    className="absolute inset-0 rounded-full border-4 border-blue-500/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                  />
                  
                  <motion.div 
                    className="absolute inset-5 rounded-full border-4 border-t-blue-400 border-r-transparent border-b-transparent border-l-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                  />
                  
                  <motion.div 
                    className="absolute inset-10 rounded-full border-4 border-r-indigo-500 border-t-transparent border-b-transparent border-l-transparent"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                  />
                  
                  {/* Binary/code particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute text-xs text-blue-300/70 font-mono"
                      style={{
                        left: `${30 + Math.random() * 40}%`,
                        top: `${30 + Math.random() * 40}%`,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                        y: [0, -20 - Math.random() * 20],
                        x: [0, (Math.random() * 20) - 10]
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 4,
                      }}
                    >
                      {["01", "{}", "[]", ":/", "=>", "&lt;&gt;"][i]}
                    </motion.div>
                  ))}
                </div>
                
                <motion.h3 
                  className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {selectedType === 'text' ? 'Analyzing Document' : 
                   selectedType === 'image' ? 'Processing Image' : 
                   'Transcribing Audio'}
                </motion.h3>
                
                <div className="space-y-4">
                  <p className="text-gray-300">Our AI agents are extracting structured data</p>
                  
                  {/* Processing steps with sequential animations */}
                  <div className="space-y-2.5 pt-2">
                    {[
                      {
                        text: selectedType === 'text' ? "Extracting text content..." : 
                              selectedType === 'image' ? "Performing OCR..." : 
                              "Processing audio stream...",
                        delay: 0
                      },
                      {
                        text: selectedType === 'text' ? "Identifying structure..." : 
                              selectedType === 'image' ? "Recognizing layout..." : 
                              "Converting speech to text...",
                        delay: 2
                      },
                      {
                        text: "Analyzing content...",
                        delay: 4
                      },
                      {
                        text: "Generating JSON output...",
                        delay: 6
                      }
                    ].map((step, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-center space-x-3 text-left"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ 
                          opacity: [0, 1, 0.7],
                          x: [-5, 0, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "loop",
                          repeatDelay: 6,
                          delay: step.delay,
                          ease: "easeOut"
                        }}
                      >
                        <motion.div 
                          className={`w-2 h-2 rounded-full ${
                            index === 0 ? "bg-blue-500" :
                            index === 1 ? "bg-indigo-500" :
                            index === 2 ? "bg-violet-500" :
                            "bg-purple-500"
                          }`}
                          animate={{
                            scale: [1, 1.5, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: step.delay,
                          }}
                        />
                        <span className="text-sm text-gray-200">{step.text}</span>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Advanced progress bar */}
                  <div className="h-2 w-full bg-gray-800/80 rounded-full overflow-hidden border border-gray-700/80 p-0.5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-full relative"
                      style={{ backgroundSize: '200% 100%' }}
                      animate={{ 
                        width: ["5%", "95%"],
                        backgroundPosition: ["0% 0%", "100% 0%"]
                      }}
                      transition={{ 
                        width: {
                          duration: 15,
                          ease: "easeInOut"
                        },
                        backgroundPosition: {
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                    >
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                        animate={{ 
                          x: ["-100%", "100%"]
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 px-1">
                    <span>Processing: {fileName}</span>
                    <span>Please wait...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        className="z-10 max-w-6xl w-full space-y-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative mb-6"
          >
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl"></div>
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold relative z-10"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-300">
                Document
              </span>{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500">
                Intelligence
              </span>
            </motion.h1>
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-sky-500/0 via-sky-500/80 to-sky-500/0"></div>
          </motion.div>
          
          <motion.p 
            className="text-lg md:text-xl max-w-2xl mx-auto text-gray-300/90 px-4 font-light"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Upload and process your content with AI to extract structured data
          </motion.p>
        </div>
        
        {/* Document Type Selection - Improved Tab Navigation */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full"
        >
          {/* Modern Document Type Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-[#1A2640]/60 backdrop-blur-xl border border-sky-500/10 rounded-2xl p-1.5 shadow-lg shadow-sky-900/10 max-w-full overflow-x-auto no-scrollbar">
              <div className="flex min-w-[500px] md:min-w-0">
                {[
                  {
                    id: 'text',
                    title: 'Text Documents',
                    shortTitle: 'Text',
                    description: 'PDFs, CSVs, and web content',
                    color: "from-sky-500 to-blue-600",
                    hoverColor: "hover:bg-sky-900/20",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 md:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )
                  },
                  {
                    id: 'image',
                    title: 'Images',
                    shortTitle: 'Images',
                    description: 'Photos, scans, and documents',
                    color: "from-blue-500 to-indigo-600",
                    hoverColor: "hover:bg-blue-900/20",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 md:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )
                  },
                  {
                    id: 'audio',
                    title: 'Audio',
                    shortTitle: 'Audio',
                    description: 'Transcribe spoken content',
                    color: "from-violet-500 to-purple-600",
                    hoverColor: "hover:bg-violet-900/20",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 md:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )
                  }
                ].map((type, index) => (
                  <motion.button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center px-4 sm:px-5 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                      selectedType === type.id 
                        ? `bg-gradient-to-r ${type.color} text-white shadow-xl` 
                        : `text-gray-200 ${type.hoverColor}`
                    }`}
                    whileHover={{ 
                      scale: 1.03,
                      boxShadow: selectedType === type.id ? "0 8px 20px rgba(14, 165, 233, 0.2)" : "0 5px 15px rgba(3, 105, 161, 0.1)"
                    }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ 
                      delay: 0.3 + (index * 0.1),
                      duration: 0.5,
                      type: "spring",
                      stiffness: 100
                    }}
                  >
                    {type.icon}
                    <span className="hidden sm:inline">{type.title}</span>
                    <span className="sm:hidden">{type.shortTitle}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-gray-900/70 backdrop-blur-md border border-gray-800/40 shadow-xl overflow-hidden">
                  <div className={`h-1.5 w-full bg-gradient-to-r ${
                    selectedType === 'text' ? 'from-blue-600 to-blue-700' :
                    selectedType === 'image' ? 'from-emerald-600 to-emerald-700' :
                    'from-amber-600 to-amber-700'
                  }`}></div>
                  
                  <div className="p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${
                      selectedType === 'text' ? 'from-blue-500/20 to-blue-700/20 border-blue-500/30' :
                      selectedType === 'image' ? 'from-emerald-500/20 to-emerald-700/20 border-emerald-500/30' :
                      'from-amber-500/20 to-amber-700/20 border-amber-500/30'
                    } border flex items-center justify-center shadow-lg mb-3 md:mb-0`}>
                      <div className={`text-${
                        selectedType === 'text' ? 'blue' :
                        selectedType === 'image' ? 'emerald' :
                        'amber'
                      }-400`}>
                        {selectedType === 'text' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {selectedType === 'image' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        {selectedType === 'audio' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold text-white mb-2">{
                        selectedType === 'text' ? 'Text Documents' :
                        selectedType === 'image' ? 'Image Processing' :
                        'Audio Transcription'
                      }</h3>
                      
                      <p className="text-gray-300 mb-4">{
                        selectedType === 'text' ? 'Upload PDFs, DOC/DOCX, TXT, or CSV files to extract structured data, identify entities, and process tables and forms.' :
                        selectedType === 'image' ? 'Process scanned documents, photos with text, receipts, business cards, and other image formats with our advanced OCR capabilities.' :
                        'Convert spoken audio into structured text, identify multiple speakers, and extract key information from conversations or presentations.'
                      }</p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedType === 'text' && (
                          <>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800/30">
                              PDFs
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800/30">
                              DOC/DOCX
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800/30">
                              TXT
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800/30">
                              CSV
                            </span>
                          </>
                        )}
                        {selectedType === 'image' && (
                          <>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-300 border border-emerald-800/30">
                              JPG/JPEG
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-300 border border-emerald-800/30">
                              PNG
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-300 border border-emerald-800/30">
                              TIFF
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-300 border border-emerald-800/30">
                              WEBP
                            </span>
                          </>
                        )}
                        {selectedType === 'video' && (
                          <>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-800/30">
                              MP4
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-800/30">
                              MOV
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-800/30">
                              WEBM
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-800/30">
                              AVI
                            </span>
                          </>
                        )}
                        {selectedType === 'audio' && (
                          <>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-300 border border-amber-800/30">
                              MP3
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-300 border border-amber-800/30">
                              WAV
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-300 border border-amber-800/30">
                              M4A
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-300 border border-amber-800/30">
                              OGG
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
        
        {/* Enhanced Upload Area */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="bg-gray-900/70 backdrop-blur-md border border-gray-800/40 shadow-xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-3xl rounded-full"></div>
            <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 blur-3xl rounded-full"></div>
            
            <CardHeader>
              <div className="flex items-center mb-2">
                <div className={`h-6 w-6 rounded-md mr-3 bg-gradient-to-br ${
                  selectedType === 'text' ? 'from-blue-500 to-blue-700' :
                  selectedType === 'image' ? 'from-emerald-500 to-emerald-700' :
                  selectedType === 'video' ? 'from-purple-500 to-purple-700' :
                  'from-amber-500 to-amber-700'
                } flex items-center justify-center`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <CardTitle className="text-2xl text-white">Upload {selectedType === 'text' ? 'Document' : selectedType === 'image' ? 'Image' : 'Audio'}</CardTitle>
              </div>
              <CardDescription className="text-gray-300 pl-9">
                {selectedType === 'text' && "Upload PDFs, DOC/DOCX, or CSV files to extract structured information and insights"}
                {selectedType === 'image' && "Upload images to perform OCR and extract text content with layout recognition"}
                {selectedType === 'audio' && "Upload audio files to transcribe and analyze spoken content with speaker detection"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8">
              <motion.div 
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 relative group ${
                  fileName ? 'border-gray-600 bg-gray-800/40' : 'border-gray-700 hover:border-blue-500/70 bg-gray-800/30'
                }`}
                whileHover={{ 
                  scale: 1.01, 
                  boxShadow: '0px 0px 15px rgba(59, 130, 246, 0.2)'
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              >
                {/* Animated background gradient for hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>

                {/* Upload particle effects */}
                <motion.div 
                  className="absolute left-1/2 top-0 w-1 h-10"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    y: [0, 60],
                    x: [-30, 30]
                  }}
                  transition={{ 
                    duration: 2.5,
                    repeat: Infinity,
                    delay: 1,
                    repeatDelay: 2
                  }}
                >
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                </motion.div>
                
                <motion.div 
                  className="absolute left-1/4 top-0 w-1 h-10"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    y: [0, 80],
                    x: [20, -20]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: 2,
                    repeatDelay: 1.5
                  }}
                >
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                </motion.div>

                <div className="space-y-6 relative z-10">
                  <motion.div
                    className={`mx-auto h-24 w-24 flex items-center justify-center rounded-lg ${
                      selectedType === 'text' ? 'bg-blue-900/20 border border-blue-700/30' :
                      selectedType === 'image' ? 'bg-emerald-900/20 border border-emerald-700/30' :
                      selectedType === 'video' ? 'bg-purple-900/20 border border-purple-700/30' :
                      'bg-amber-900/20 border border-amber-700/30'
                    }`}
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ 
                      scale: fileName ? 1 : [0.95, 1.05, 0.95], 
                      opacity: 1 
                    }}
                    transition={{ 
                      repeat: fileName ? 0 : Infinity, 
                      repeatType: "reverse", 
                      duration: 3,
                      ease: "easeInOut"
                    }}
                  >
                    {fileName ? (
                      <div className={`text-${
                        selectedType === 'text' ? 'blue' :
                        selectedType === 'image' ? 'emerald' :
                        selectedType === 'video' ? 'purple' :
                        'amber'
                      }-400 h-16 w-16`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    ) : (
                      <div className={`text-${
                        selectedType === 'text' ? 'blue' :
                        selectedType === 'image' ? 'emerald' :
                        selectedType === 'video' ? 'purple' :
                        'amber'
                      }-400 h-16 w-16`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                  
                  {fileName ? (
                    <div className="flex flex-col space-y-3 items-center">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <span className="text-white text-lg font-medium">{fileName}</span>
                        <p className="text-gray-400 text-sm mt-1">File ready for processing</p>
                      </motion.div>
                      
                      <motion.button 
                        className="flex items-center px-4 py-1.5 bg-red-900/20 hover:bg-red-800/40 text-red-400 rounded-full text-sm font-medium border border-red-800/40 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setFileName('');
                          setFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove file
                      </motion.button>
                    </div>
                  ) : (
                    <>
                      <div className="flex text-base justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-900/20 transition-colors flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>Choose {selectedType === 'text' ? 'document' : selectedType}</span>
                          <input 
                            id="file-upload" 
                            ref={fileInputRef}
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <div className="bg-gray-800/70 px-3 py-1.5 rounded-lg border border-gray-700/50">
                          <p className="text-sm text-gray-300 font-medium flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {selectedType === 'text' && "PDF, DOCX, TXT, CSV up to 20MB"}
                            {selectedType === 'image' && "JPG, PNG, GIF, TIFF, WEBP up to 15MB"}
                            {selectedType === 'video' && "MP4, MOV, WEBM up to 200MB"}
                            {selectedType === 'audio' && "MP3, WAV, FLAC, OGG up to 50MB"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="instructions" className="flex items-center text-base font-medium text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Processing Instructions (Optional)
                  </label>
                  
                  {instructions.length > 0 && (
                    <span className="text-xs text-gray-400">{instructions.length} characters</span>
                  )}
                </div>
                
                <div className="relative">
                  <textarea 
                    id="instructions" 
                    name="instructions" 
                    rows={4} 
                    className="block w-full px-4 py-3 text-base border border-gray-700/80 bg-gray-800/60 backdrop-blur-sm text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 transition-colors"
                    placeholder={
                      selectedType === 'text' ? "e.g., Extract all dates, names, and financial figures from this document" :
                      selectedType === 'image' ? "e.g., Focus on extracting text from tables and forms" :
                      selectedType === 'video' ? "e.g., Identify speakers and create timestamps for key topics" :
                      "e.g., Transcribe all speakers and identify questions vs answers"
                    }
                    value={instructions}
                    onChange={handleInstructionChange}
                  ></textarea>
                  
                  {selectedType === 'text' && !instructions && (
                    <div className="absolute top-2 right-2 text-xs bg-blue-900/20 text-blue-300 px-2 py-1 rounded border border-blue-800/30">
                      Try "Extract invoice details and payment terms"
                    </div>
                  )}
                  {selectedType === 'image' && !instructions && (
                    <div className="absolute top-2 right-2 text-xs bg-emerald-900/20 text-emerald-300 px-2 py-1 rounded border border-emerald-800/30">
                      Try "Extract table data and form fields"
                    </div>
                  )}
                </div>
              </div>
              
              {/* Enhanced Processing Status */}
              <AnimatePresence mode="wait">
                {uploadStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-xl overflow-hidden shadow-xl border ${
                      uploadStatus.status === 'error' ? 'border-red-700/50 bg-gradient-to-br from-red-900/20 to-gray-900/80' : 
                      uploadStatus.status === 'completed' ? 'border-emerald-700/50 bg-gradient-to-br from-emerald-900/20 to-gray-900/80' : 
                      'border-blue-700/50 bg-gradient-to-br from-blue-900/20 to-gray-900/80'
                    } backdrop-blur-sm`}
                  >
                    {/* Status Header */}
                    <div className={`p-4 flex items-center justify-between ${
                      uploadStatus.status === 'error' ? 'bg-red-900/40 border-b border-red-800/50' : 
                      uploadStatus.status === 'completed' ? 'bg-emerald-900/40 border-b border-emerald-800/50' : 
                      'bg-blue-900/40 border-b border-blue-800/50'
                    }`}>
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          uploadStatus.status === 'error' ? 'bg-red-700/40' : 
                          uploadStatus.status === 'completed' ? 'bg-emerald-700/40' : 
                          'bg-blue-700/40'
                        }`}>
                          {uploadStatus.status === 'error' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : uploadStatus.status === 'completed' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : uploadStatus.status === 'uploading' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-white">
                            {uploadStatus.status === 'error' ? 'Processing Error' : 
                            uploadStatus.status === 'uploading' ? 'Uploading Document' :
                            uploadStatus.status === 'processing' ? 'Processing Document' : 
                            'Processing Complete'}
                          </h3>
                          <p className="text-sm text-gray-300">
                            {uploadStatus.message || 'Processing your document...'}
                          </p>
                        </div>
                      </div>
                      
                      {uploadStatus.status === 'uploading' || uploadStatus.status === 'processing' ? (
                        <div className="flex items-center">
                          <div className="w-10 h-10 relative flex justify-center items-center">
                            <div className="absolute w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Results Section */}
                    {uploadStatus.status === 'completed' && uploadStatus.result && (
                      <div className="p-5">
                        <div className="mb-4">
                          <div className="flex items-center mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h4 className="text-lg font-semibold text-white">Extracted Data</h4>
                          </div>                            <div className="bg-gray-900/80 border border-gray-800 rounded-lg shadow-inner overflow-hidden">
                              <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900">
                                <div className="flex space-x-1.5">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-xs text-gray-400">JSON output</span>
                                <div className="w-4"></div>
                              </div>
                              
                              {/* Filter options for result types */}
                              {uploadStatus.result.results && uploadStatus.result.results.length > 1 && (
                                <div className="p-2 border-b border-gray-800 bg-gray-900/70 flex flex-wrap gap-2 items-center">
                                  <span className="text-xs text-gray-400 mr-1">Filter:</span>
                                  
                                  {/* Filter buttons with animation */}
                                  {(Array.from(new Set(uploadStatus.result.results.map((item: { agent_type: string }) => item.agent_type))) as string[]).map(
                                    (agentType: string, idx: number) => {
                                      const colors = {
                                        text: 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border-blue-700/40',
                                        image: 'bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-300 border-emerald-700/40',
                                        video: 'bg-purple-900/30 hover:bg-purple-800/40 text-purple-300 border-purple-700/40', 
                                        audio: 'bg-amber-900/30 hover:bg-amber-800/40 text-amber-300 border-amber-700/40',
                                        metadata: 'bg-indigo-900/30 hover:bg-indigo-800/40 text-indigo-300 border-indigo-700/40',
                                      };
                                      const type = agentType.toLowerCase().includes('text') ? 'text' : 
                                                agentType.toLowerCase().includes('image') ? 'image' : 
                                                agentType.toLowerCase().includes('video') ? 'video' : 
                                                agentType.toLowerCase().includes('audio') ? 'audio' : 'metadata';
                                      
                                      return (
                                        <motion.button 
                                          key={idx}
                                          className={`text-xs px-2 py-0.5 rounded-md border ${colors[type as keyof typeof colors]} transition-colors`}
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          initial={{ opacity: 0, y: -10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: idx * 0.1 }}
                                        >
                                          {agentType}
                                        </motion.button>
                                      );
                                    }
                                  )}
                                  
                                  <button className="text-xs px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 ml-auto">
                                    All Results
                                  </button>
                                </div>
                              )}
                              
                              <div className="overflow-auto max-h-72 p-4">
                                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
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
                              
                              {/* Result visualization tabs */}
                              {uploadStatus.result.results && uploadStatus.result.results.length > 0 && (
                                <div className="border-t border-gray-800 px-4 py-3 flex justify-between items-center bg-gray-900/70">
                                  <div className="flex space-x-2">
                                    <button className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                      JSON View
                                    </button>
                                    <button className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                      </svg>
                                      Data Viewer
                                    </button>
                                  </div>
                                  <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                    </svg>
                                    Expand View
                                  </button>
                                </div>
                              )}
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 mt-6">
                          {uploadStatus.resultUrl && (
                            <motion.a 
                              href={uploadStatus.resultUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20 transition-colors"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download JSON Results
                            </motion.a>
                          )}
                          
                          <Link href="/dataset">
                            <motion.button 
                              className="flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-lg shadow-emerald-900/20 transition-colors"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              Explore Dataset
                            </motion.button>
                          </Link>
                          
                          <motion.button
                            onClick={handleReset}
                            className="flex items-center px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium shadow-lg shadow-gray-900/20 transition-colors"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Process Another File
                          </motion.button>
                        </div>
                      </div>
                    )}
                    
                    {/* Error Details */}
                    {uploadStatus.status === 'error' && (
                      <div className="p-5">
                        <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-4 text-red-200 text-sm">
                          <p>{uploadStatus.message || 'An error occurred during processing.'}</p>
                          <p className="mt-2 text-red-300">Please try again or contact support if the issue persists.</p>
                        </div>
                        
                        <motion.button
                          onClick={handleReset}
                          className="flex items-center px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium shadow-lg shadow-gray-900/20 transition-colors mt-4"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Try Again
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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
        

      </motion.div>
    </main>
  );
}