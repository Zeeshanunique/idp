"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Home() {
  // Animation variants
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

  return (
    <main className="flex min-h-screen flex-col items-center py-16 px-8 bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Hero Section */}
      <motion.div
        className="z-10 max-w-6xl w-full flex flex-col items-center justify-center mb-20"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-6xl font-bold text-center mb-6 text-white leading-tight"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        >
          Autonomous Document Intelligence
        </motion.h1>
        <motion.p 
          className="text-2xl text-center max-w-3xl mx-auto text-gray-300 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Transform unstructured documents into structured JSON data with our specialized AI agents
        </motion.p>

        <motion.div 
          className="flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/upload">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-lg shadow-lg transition-all duration-300 hover:shadow-blue-500/30">
              Upload Documents
            </Button>
          </Link>
          {/* <Link href="/case">
            <Button variant="outline" className="bg-transparent border-2 border-gray-600 hover:border-gray-400 text-white px-8 py-6 text-lg rounded-lg shadow-lg transition-all duration-300">
              View Case Files
            </Button>
          </Link> */}
        </motion.div>
      </motion.div>

      {/* Document Processing Section */}
      <motion.div 
        className="w-full max-w-6xl mb-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-center mb-12 text-white"
          variants={itemVariants}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Intelligent Document Processing
          </span>
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              title: "Text Analysis",
              description: "Extract structured data from PDFs, CSVs, and web content",
              color: "from-blue-500/20 to-blue-700/20"
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              title: "Image OCR",
              description: "Convert image text to structured data through OCR",
              color: "from-green-500/20 to-green-700/20"
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ),
              title: "Video Processing",
              description: "Extract dialog and timestamps from video content",
              color: "from-purple-500/20 to-purple-700/20"
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ),
              title: "Audio Transcription",
              description: "Turn spoken content into structured data with metadata",
              color: "from-orange-500/20 to-orange-700/20"
            }
          ].map((feature, index) => (
            <motion.div 
              key={index}
              className="flex flex-col h-full"
              variants={itemVariants}
            >
              <Card className="bg-gray-800 border-gray-700 shadow-xl h-full hover:shadow-2xl transition-all duration-500 hover:border-gray-600 overflow-hidden">
                <div className={`h-2 w-full bg-gradient-to-r ${feature.color}`}></div>
                <CardHeader className="pb-2">
                  <div className="text-blue-400 mb-2">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 pt-2">
                  <p>{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Agent Profiles Section */}
      <motion.div 
        className="w-full max-w-6xl mb-24"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">Meet Our AI Agents</h2>
        <p className="text-xl text-center text-gray-400 mb-12 max-w-3xl mx-auto">
          Specialized agents working together to unlock the intelligence in your documents
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[
            { 
              title: "Text Data Specialist",
              desc: "Processes and extracts structured JSON from uploaded text files like PDFs, CSVs, and web content", 
              color: "from-blue-800 to-blue-600",
              icon: "📄",
              abilities: ["Data extraction", "Table recognition", "Key-value parsing", "Natural language processing"]
            },
            { 
              title: "OCR Image Analyst", 
              desc: "Uses OCR to extract structured information from image files and convert it into JSON format", 
              color: "from-green-800 to-green-600",
              icon: "🖼️",
              abilities: ["Optical character recognition", "Form detection", "Layout analysis", "Handwriting recognition"]
            },
            { 
              title: "Video-to-Text Transcriber", 
              desc: "Analyzes videos to extract spoken content and structure it into JSON format", 
              color: "from-purple-800 to-purple-600",
              icon: "🎬",
              abilities: ["Speech recognition", "Speaker diarization", "Timestamp generation", "Content summarization"]
            },
            { 
              title: "Audio Transcriber", 
              desc: "Transcribes audio content and converts important information into structured JSON",
              color: "from-orange-800 to-orange-600",
              icon: "🎧",
              abilities: ["Voice recognition", "Tone analysis", "Keyword extraction", "Conversation structuring"]
            },
          ].map((agent, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + (index * 0.2) }}
              className="relative rounded-xl overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-50 rounded-xl`}></div>
              <div className="relative z-10 p-8 bg-gray-900 bg-opacity-90 rounded-xl border border-gray-800 h-full">
                <div className="flex items-center mb-6">
                  <div className="text-4xl mr-4">{agent.icon}</div>
                  <h3 className="text-2xl font-bold text-white">{agent.title}</h3>
                </div>
                <p className="text-gray-300 mb-6">{agent.desc}</p>
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.abilities.map((ability, idx) => (
                      <span 
                        key={idx}
                        className="bg-gray-800 text-gray-300 text-sm px-3 py-1 rounded-full"
                      >
                        {ability}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* CTA Section */}
      <motion.div 
        className="w-full max-w-5xl mb-16 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <h2 className="text-3xl font-bold text-white mb-6">Ready to Extract Intelligence?</h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
          Upload your documents now and let our intelligent agents transform them into structured data
        </p>
        <Link href="/upload">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-lg shadow-lg transition-all duration-300 hover:shadow-blue-500/30">
            Start Processing Documents
          </Button>
        </Link>
      </motion.div>
    </main>
  );
}