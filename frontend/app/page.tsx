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
  
  // Enhanced parallax scroll effect for background elements
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Apply subtle parallax to background elements
      document.querySelectorAll('.parallax-bg').forEach((el: any, index) => {
        const speed = index % 2 === 0 ? 0.05 : 0.03;
        el.style.transform = `translateY(${scrollY * speed}px)`;
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center pt-8 pb-16 px-8 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-[url('/noise.svg')] opacity-[0.025] pointer-events-none mix-blend-overlay"></div>
      
      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-radial-gradient from-gray-900 via-gray-950 to-black opacity-70 pointer-events-none"></div>
      
      {/* Improved animated glows */}
      <motion.div 
        className="absolute top-20 right-10 md:right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl parallax-bg"
        animate={{
          opacity: [0.1, 0.15, 0.1],
          scale: [1, 1.05, 1],
        }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      ></motion.div>
      
      <motion.div 
        className="absolute bottom-40 left-10 md:left-40 w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-3xl parallax-bg"
        animate={{
          opacity: [0.08, 0.12, 0.08],
          scale: [1, 1.03, 1],
        }} 
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      ></motion.div>
      
      <motion.div 
        className="absolute top-60 left-20 md:left-60 w-60 h-60 bg-cyan-500/8 rounded-full blur-3xl"
        animate={{
          opacity: [0.05, 0.1, 0.05],
          scale: [1, 1.1, 1],
        }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      ></motion.div>
      
      <motion.div 
        className="absolute right-1/4 bottom-1/3 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl"
        animate={{
          opacity: [0.05, 0.1, 0.05],
          scale: [1, 1.08, 1],
        }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      ></motion.div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:50px_50px] opacity-[0.025] pointer-events-none"></div>
      
      {/* Subtle moving particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div 
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            style={{
              top: `${10 + Math.random() * 80}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 20,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Hero Section */}
      {/* Enhanced Hero Section with floating elements */}
      <motion.div
        className="z-10 max-w-6xl w-full flex flex-col items-center justify-center mb-16 pt-8 relative"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Floating document mockups */}
        <motion.div 
          className="absolute -left-4 md:left-10 top-20 md:top-24 w-32 h-40 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20 hidden md:block"
          initial={{ opacity: 0, x: -50, rotate: -15 }}
          animate={{ opacity: 0.8, x: 0, rotate: -10 }}
          transition={{ delay: 0.3, duration: 0.7, type: "spring" }}
        >
          <div className="h-1.5 w-full bg-blue-500/20 absolute top-0"></div>
          <div className="p-2">
            <div className="w-full h-2 bg-white/10 rounded-full mb-2"></div>
            <div className="w-2/3 h-2 bg-white/10 rounded-full mb-4"></div>
            <div className="grid grid-cols-3 gap-1.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-2 bg-white/5 rounded-full"></div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="absolute -right-4 md:right-10 top-40 w-36 h-44 rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/5 backdrop-blur-sm border border-indigo-500/20 hidden md:block"
          initial={{ opacity: 0, x: 50, rotate: 15 }}
          animate={{ opacity: 0.8, x: 0, rotate: 10 }}
          transition={{ delay: 0.4, duration: 0.7, type: "spring" }}
        >
          <div className="h-1.5 w-full bg-indigo-500/20 absolute top-0"></div>
          <div className="p-2">
            <div className="w-full h-2 bg-white/10 rounded-full mb-2"></div>
            <div className="w-3/4 h-2 bg-white/10 rounded-full mb-4"></div>
            <div className="flex flex-col space-y-2">
              <div className="w-full h-4 bg-white/5 rounded"></div>
              <div className="w-full h-4 bg-white/5 rounded"></div>
              <div className="w-2/3 h-4 bg-white/5 rounded"></div>
            </div>
          </div>
        </motion.div>
        
        {/* Enhanced Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-700/30 rounded-full px-5 py-2 text-blue-300 text-sm font-medium inline-flex items-center backdrop-blur-md shadow-lg shadow-blue-900/5">
            <span className="mr-2 h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
            AI-powered Document Intelligence Platform
          </div>
        </motion.div>

        {/* Enhanced headline with mask animation */}
        <motion.h1 
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-center mb-6 leading-tight tracking-tight"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        >
          <div className="overflow-hidden">
            <motion.span
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
              className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300"
            >
              Transform Documents
            </motion.span>
          </div>
          <div className="overflow-hidden">
            <motion.span 
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
              className="inline-block bg-clip-text text-transparent bg-gradient-to-br from-blue-400 via-violet-400 to-indigo-500"
            >
              Into Structured Data
            </motion.span>
          </div>
        </motion.h1>

        <motion.p 
          className="text-xl md:text-2xl text-center max-w-3xl mx-auto text-gray-300 mb-10 leading-relaxed font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Extract meaningful insights instantly from <span className="text-blue-300 font-medium">any document format</span> using our specialized AI agents
        </motion.p>

        <motion.div 
          className="flex flex-wrap gap-5 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Link href="/upload">
            <Button className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-6 text-lg rounded-xl shadow-xl transition-all duration-300 hover:shadow-blue-500/30 font-medium hover:scale-105 transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Documents
            </Button>
          </Link>
          <Link href="/dataset">
            <Button variant="outline" className="bg-transparent bg-gray-900/40 backdrop-blur-md border-2 border-indigo-500/40 hover:border-indigo-400/70 text-white px-10 py-6 text-lg rounded-xl shadow-lg transition-all duration-300 hover:bg-indigo-900/20 hover:scale-105 transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              View Dataset
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Workflow Steps Section - Moved up for better UX */}
      <motion.div
        className="w-full max-w-6xl mb-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        {/* Background decorative elements */}
        <div className="absolute left-1/3 -translate-x-1/2 w-72 h-72 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl -z-10 parallax-bg"></div>
        
        <div className="mb-8 flex flex-col items-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-cyan-950/50 to-blue-950/50 text-cyan-300 border border-cyan-800/30 backdrop-blur-md shadow-lg shadow-cyan-900/5 mb-3">
            <span className="mr-2 h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Simple Three-Step Process
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-3 text-white leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">
              How Our Platform Works
            </span>
          </h2>
          <p className="text-gray-300 text-lg text-center max-w-2xl mb-12">
            From document upload to structured JSON in <span className="text-cyan-300 font-medium">seconds</span> with our streamlined workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 transform -translate-y-1/2 z-0"></div>

          {[
            {
              step: "01",
              title: "Upload Documents",
              description: "Upload any type of document - PDFs, images, videos, or audio files",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              ),
              color: "from-blue-600 to-cyan-600"
            },
            {
              step: "02",
              title: "AI Processing",
              description: "Our AI agents automatically extract and structure your document data",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              color: "from-cyan-600 to-indigo-600"
            },
            {
              step: "03",
              title: "Access JSON Data",
              description: "Download structured JSON or integrate directly with your systems",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              color: "from-indigo-600 to-violet-600"
            }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + (index * 0.2) }}
              whileHover={{
                y: -5,
                transition: { duration: 0.2 }
              }}
              className="relative z-10"
            >
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-xl h-full transition-all duration-300 hover:border-indigo-700/40 hover:shadow-indigo-900/20 flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <div className="text-white">
                    {step.icon}
                  </div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm text-gray-200 text-xs px-3 py-1 rounded-full mb-3 font-mono font-medium">
                  STEP {step.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Enhanced Document Processing Section with rotating visual element */}
      <motion.div 
        className="w-full max-w-6xl mb-20 relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Visual background element */}
        <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent rounded-3xl blur-3xl -z-10"></div>
        
        <motion.div 
          className="flex flex-col items-center relative"
          variants={itemVariants}
        >
          {/* Decorative element */}
          <motion.div 
            className="absolute -top-12 right-0 md:right-10 w-24 h-24 rounded-full border border-blue-500/20 opacity-40"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-blue-400 transform -translate-x-1/2"></div>
          </motion.div>
          
          <div className="mb-2 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-950/50 to-indigo-950/50 text-blue-300 border border-blue-800/30 backdrop-blur-md shadow-lg shadow-blue-900/5">
            <span className="mr-2 h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
            Comprehensive Document Capabilities
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
              Process Any Document Format
            </span>
          </h2>
          <p className="text-gray-300 text-lg text-center max-w-3xl mb-14 leading-relaxed">
            Our platform intelligently handles diverse document types with <span className="text-blue-300 font-medium">specialized AI agents</span> optimized for each format
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              title: "Text Analysis",
              description: "Extract structured data from PDFs, contracts, reports, CSVs, and web content with advanced entity recognition",
              capabilities: ["Table extraction", "Form field detection", "Entity recognition"],
              color: "from-blue-500 to-blue-700",
              bgColor: "from-blue-500/10 to-blue-700/10",
              borderColor: "border-blue-500/20"
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              title: "Image OCR",
              description: "Convert image text to structured data with advanced layout recognition and intelligent field extraction",
              capabilities: ["Layout analysis", "Handwriting recognition", "Multi-language support"],
              color: "from-emerald-500 to-emerald-700",
              bgColor: "from-emerald-500/10 to-emerald-700/10",
              borderColor: "border-emerald-500/20"
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ),
              title: "Video Processing",
              description: "Extract dialog, scenes, and timestamps from video content with speaker identification and content summary",
              capabilities: ["Speaker identification", "Scene detection", "Visual content analysis"],
              color: "from-purple-500 to-purple-700",
              bgColor: "from-purple-500/10 to-purple-700/10",
              borderColor: "border-purple-500/20"
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ),
              title: "Audio Transcription",
              description: "Transform spoken content into structured data with multi-speaker separation and contextual metadata",
              capabilities: ["Multi-speaker detection", "Noise filtering", "Contextual understanding"],
              color: "from-amber-500 to-amber-700",
              bgColor: "from-amber-500/10 to-amber-700/10",
              borderColor: "border-amber-500/20"
            }
          ].map((feature, index) => (
            <motion.div 
              key={index}
              className="flex flex-col h-full"
              variants={itemVariants}
              whileHover={{ 
                y: -6,
                transition: { duration: 0.3 }
              }}
            >
              <div className={`bg-gray-900/80 backdrop-blur-sm border ${feature.borderColor} shadow-xl h-full rounded-xl hover:shadow-2xl transition-all duration-500 hover:border-opacity-40 overflow-hidden group`}>
                <div className={`h-1.5 w-full bg-gradient-to-r ${feature.color}`}></div>
                <div className="p-6 relative">
                  <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${feature.color} blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-700`}></div>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 bg-gradient-to-br ${feature.bgColor} border ${feature.borderColor} p-3 shadow-lg`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
                  <div className="pt-2 border-t border-gray-800/50">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {feature.capabilities.map((capability, i) => (
                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Enhanced CTA Section */}
      <motion.div 
        className="w-full max-w-6xl mb-16 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        whileHover={{
          scale: 1.01,
          transition: { duration: 0.3 }
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 rounded-2xl"></div>
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay"></div>
        
        {/* Enhanced light effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-500/20 to-fuchsia-500/5 rounded-full blur-3xl"></div>
        
        {/* Moving particle effects */}
        <motion.div 
          className="absolute top-10 left-20 w-2 h-2 bg-blue-400 rounded-full"
          animate={{
            y: [0, -20, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-10 right-40 w-3 h-3 bg-indigo-400 rounded-full"
          animate={{
            y: [0, -30, 0],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 4,
            delay: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-1/2 right-20 w-2 h-2 bg-violet-400 rounded-full"
          animate={{
            y: [0, -15, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2.5,
            delay: 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="relative z-10 rounded-2xl p-12 border border-indigo-800/40 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left">
              <div className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-700/30">
                GET STARTED TODAY
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Transform</span> Your Documents?</h2>
              <p className="text-xl text-gray-200 max-w-2xl mb-8 md:mb-0 leading-relaxed">
                Upload your documents now and let our AI agents extract structured data <span className="font-medium text-indigo-300">in seconds</span>
              </p>
              
              {/* Added feature bullets */}
              <div className="hidden md:flex flex-col space-y-3 mt-8">
                {[
                  "99% accuracy on document extraction",
                  "Support for 20+ document types",
                  "Enterprise-grade security & compliance"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center text-gray-300">
                    <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <div className="bg-gray-900/60 backdrop-blur-md p-6 rounded-xl border border-gray-800/60 shadow-xl">
                <Link href="/upload">
                  <Button className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full px-8 py-6 text-lg rounded-xl shadow-xl transition-all duration-300 hover:shadow-blue-500/30 font-medium mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Start Processing Documents
                  </Button>
                </Link>
                <Link href="/dataset">
                  <Button variant="outline" className="bg-gray-900/50 backdrop-blur-sm border-2 border-gray-700/80 hover:border-indigo-500/50 text-white w-full px-8 py-6 text-lg rounded-xl shadow-xl transition-all duration-300 hover:bg-indigo-900/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    View Dataset
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>


    </main>
  );
}