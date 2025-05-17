"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info as InfoCircle, AlertTriangle, CheckCircle, Activity, FileText, Image, Mic, Video, ShieldCheck, Clock, BarChart3, AlertOctagon } from 'lucide-react';

// Define interfaces for our data structure
interface DashboardData {
  documentCounts: {
    text: number;
    image: number;
    audio: number;
    video: number;
  };
  processingStats: {
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    lastProcessed: string;
  };
  modelPerformance: {
    accuracy: number;
    completeness: number;
    consistency: number;
    reliability: number;
  };
  privacyRisk: {
    overall: string;
    piiDetected: number;
    sensitiveContentWarnings: number;
    dataRetentionCompliance: string;
    recommendations: string[];
  };
  activityLog: {
    id: number;
    type: string;
    status: string;
    timestamp: string;
    filename: string;
  }[];
  documentTypeData: {
    name: string;
    value: number;
    color: string;
  }[];
  processingTimeData: {
    name: string;
    time: number;
  }[];
  weeklyActivity: {
    day: string;
    count: number;
  }[];
  langsmithStatus?: {
    connected: boolean;
    project: string;
  };
}

// Fake data for demonstration
const MOCK_DATA: DashboardData = {
  documentCounts: {
    text: 24,
    image: 17,
    audio: 11,
    video: 3
  },
  processingStats: {
    totalProcessed: 55,
    successRate: 94.5,
    averageProcessingTime: 2.3,
    lastProcessed: '2025-05-17T10:23:45Z'
  },
  modelPerformance: {
    accuracy: 91.2,
    completeness: 87.5,
    consistency: 89.8,
    reliability: 92.3
  },
  privacyRisk: {
    overall: 'Low',
    piiDetected: 3,
    sensitiveContentWarnings: 1,
    dataRetentionCompliance: 'Compliant',
    recommendations: [
      'Implement PII redaction for document uploads',
      'Enable content filtering for sensitive information'
    ]
  },
  activityLog: [
    { id: 1, type: 'text', status: 'success', timestamp: '2025-05-17T13:42:15Z', filename: 'financial_report.pdf' },
    { id: 2, type: 'audio', status: 'success', timestamp: '2025-05-17T12:36:10Z', filename: 'meeting_recording.m4a' },
    { id: 3, type: 'image', status: 'warning', timestamp: '2025-05-17T11:15:23Z', filename: 'contract_scan.png' },
    { id: 4, type: 'text', status: 'success', timestamp: '2025-05-17T10:52:08Z', filename: 'legal_document.docx' },
    { id: 5, type: 'audio', status: 'success', timestamp: '2025-05-17T09:27:45Z', filename: 'interview.wav' }
  ],
  documentTypeData: [
    { name: 'Text', value: 24, color: '#3b82f6' },
    { name: 'Image', value: 17, color: '#10b981' },
    { name: 'Audio', value: 11, color: '#f59e0b' },
    { name: 'Video', value: 3, color: '#8b5cf6' }
  ],
  processingTimeData: [
    { name: 'Text', time: 1.2 },
    { name: 'Image', time: 2.5 },
    { name: 'Audio', time: 3.4 },
    { name: 'Video', time: 5.7 }
  ],
  weeklyActivity: [
    { day: 'Mon', count: 8 },
    { day: 'Tue', count: 12 },
    { day: 'Wed', count: 7 },
    { day: 'Thu', count: 14 },
    { day: 'Fri', count: 10 },
    { day: 'Sat', count: 3 },
    { day: 'Sun', count: 1 }
  ]
};

const privacyRiskColors = {
  Low: 'bg-green-500',
  Medium: 'bg-amber-500',
  High: 'bg-red-500'
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(MOCK_DATA);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch dashboard data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real data from API
      try {
        const response = await api.get('/api/dashboard/metrics');
        if (response.data) {
          setDashboardData(response.data);
          console.log("Loaded dashboard data from API");
        } else {
          // Fallback to mock data if API returns empty response
          console.log("API returned empty response, using mock data");
          setDashboardData(MOCK_DATA);
        }
      } catch (apiError) {
        // If API call fails, use mock data
        console.warn("API call failed, using mock data:", apiError);
        setDashboardData(MOCK_DATA);
      }
      
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error in dashboard data loading:", error);
      setDashboardData(MOCK_DATA);
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);
  
  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log("Auto-refreshing dashboard data");
      fetchData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Format timestamp to readable date
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get appropriate icon for document type
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'text':
        return <FileText className="h-4 w-4 mr-1" />;
      case 'image':
        return <Image className="h-4 w-4 mr-1" />;
      case 'audio':
        return <Mic className="h-4 w-4 mr-1" />;
      case 'video':
        return <Video className="h-4 w-4 mr-1" />;
      default:
        return <FileText className="h-4 w-4 mr-1" />;
    }
  };

  // Get appropriate icon and color for status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500 hover:bg-amber-600"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-500 hover:bg-red-600"><AlertOctagon className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge><Activity className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  return (
    <div className="container py-8">
      {showInfoBanner && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <InfoCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700">Welcome to the new Dashboard!</AlertTitle>
          <AlertDescription className="text-blue-600">
            This Dashboard replaces the About page, providing real-time metrics and analytics about your document processing system.
            <button 
              onClick={() => setShowInfoBanner(false)} 
              className="ml-2 text-blue-700 underline hover:text-blue-900"
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="flex items-center text-sm">
            <span className="text-muted-foreground mr-2">Last updated:</span>
            <span>{lastUpdated.toLocaleTimeString()}</span>
          </div>
          
          <button 
            onClick={fetchData} 
            className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            <svg 
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
          <div className="flex items-center">
            <input 
              id="autoRefresh" 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)} 
              className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="autoRefresh" className="text-sm cursor-pointer">
              Auto-refresh
            </label>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-2" />Overview</TabsTrigger>
          <TabsTrigger value="performance"><Activity className="h-4 w-4 mr-2" />Performance</TabsTrigger>
          <TabsTrigger value="privacy"><ShieldCheck className="h-4 w-4 mr-2" />Privacy Risk</TabsTrigger>
          <TabsTrigger value="activity"><Clock className="h-4 w-4 mr-2" />Recent Activity</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Document Counts */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Documents</CardTitle>
                <CardDescription>By document type</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><FileText className="h-4 w-4 mr-2 text-blue-500" />Text</span>
                      <span className="font-semibold">{dashboardData.documentCounts.text}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><Image className="h-4 w-4 mr-2 text-emerald-500" />Images</span>
                      <span className="font-semibold">{dashboardData.documentCounts.image}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><Mic className="h-4 w-4 mr-2 text-amber-500" />Audio</span>
                      <span className="font-semibold">{dashboardData.documentCounts.audio}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><Video className="h-4 w-4 mr-2 text-purple-500" />Video</span>
                      <span className="font-semibold">{dashboardData.documentCounts.video}</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <div className="text-sm text-muted-foreground">
                  Total: {loading ? '...' : dashboardData.processingStats.totalProcessed} documents
                </div>
              </CardFooter>
            </Card>
            
            {/* Success Rate */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Success Rate</CardTitle>
                <CardDescription>Processing success percentage</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-24">
                    <div className="text-4xl font-bold text-green-500">
                      {dashboardData.processingStats.successRate}%
                    </div>
                    <Progress 
                      value={dashboardData.processingStats.successRate} 
                      className="mt-2 h-2 w-full" 
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <div className="text-sm text-muted-foreground">
                  Last updated: {loading ? '...' : formatDate(dashboardData.processingStats.lastProcessed)}
                </div>
              </CardFooter>
            </Card>
            
            {/* Processing Time */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Processing Time</CardTitle>
                <CardDescription>Average processing time</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-24">
                    <div className="text-4xl font-bold text-blue-500">
                      {dashboardData.processingStats.averageProcessingTime}s
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Per document
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <div className="text-sm text-muted-foreground">
                  Average across all document types
                </div>
              </CardFooter>
            </Card>
            
            {/* Privacy Risk Overview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Privacy Risk</CardTitle>
                <CardDescription>Overall privacy assessment</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-24">
                    <div className={`text-2xl font-bold px-4 py-2 rounded-full ${privacyRiskColors[dashboardData.privacyRisk.overall as keyof typeof privacyRiskColors]}`}>
                      {dashboardData.privacyRisk.overall}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {dashboardData.privacyRisk.piiDetected} PII instances detected
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 flex justify-between">
                <div className="text-sm text-muted-foreground">
                  <span className={dashboardData.privacyRisk.dataRetentionCompliance === 'Compliant' ? 'text-green-500' : 'text-red-500'}>
                    {dashboardData.privacyRisk.dataRetentionCompliance}
                  </span>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Document Distribution</CardTitle>
                <CardDescription>By document type</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.documentTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {dashboardData.documentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} documents`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>Documents processed per day</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData.weeklyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`${value} documents`, 'Processed']} />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Processing Time by Document Type</CardTitle>
                <CardDescription>Average seconds per document type</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData.processingTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} seconds`, 'Processing Time']} />
                      <Bar dataKey="time" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Metrics</CardTitle>
                <CardDescription>Overall system quality assessment</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Accuracy</span>
                        <span className="font-semibold">{dashboardData.modelPerformance.accuracy}%</span>
                      </div>
                      <Progress value={dashboardData.modelPerformance.accuracy} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        Measures how correct the model's outputs are against a ground truth.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Completeness</span>
                        <span className="font-semibold">{dashboardData.modelPerformance.completeness}%</span>
                      </div>
                      <Progress value={dashboardData.modelPerformance.completeness} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        Evaluates how thoroughly the model processes all aspects of a document.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Consistency</span>
                        <span className="font-semibold">{dashboardData.modelPerformance.consistency}%</span>
                      </div>
                      <Progress value={dashboardData.modelPerformance.consistency} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        Measures how consistently the model delivers similar results for similar inputs.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Reliability</span>
                        <span className="font-semibold">{dashboardData.modelPerformance.reliability}%</span>
                      </div>
                      <Progress value={dashboardData.modelPerformance.reliability} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        Assesses the model's ability to perform without errors or failures over time.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="text-sm text-muted-foreground">
                  Performance metrics are calculated from LangSmith evaluations and system monitoring.
                </div>
              </CardFooter>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>LangSmith Integration Status</CardTitle>
                  <CardDescription>Model evaluation and tracing</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className={`h-4 w-4 rounded-full ${dashboardData.langsmithStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="font-medium">{dashboardData.langsmithStatus?.connected ? 'Connected' : 'Disconnected'}</p>
                          <p className="text-sm text-muted-foreground">
                            Project: {dashboardData.langsmithStatus?.project || 'Not configured'}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Features enabled:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Trace logging</li>
                          <li>Performance monitoring</li>
                          <li>Model evaluations</li>
                          <li>Dataset creation</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="text-sm text-muted-foreground">
                    LangSmith provides observability and evaluation for LLM applications.
                  </div>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Model Limitations</CardTitle>
                  <CardDescription>Known constraints and edge cases</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Audio Transcription</AlertTitle>
                        <AlertDescription>
                          May have reduced accuracy with heavy background noise or strong accents.
                        </AlertDescription>
                      </Alert>
                      
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Image Processing</AlertTitle>
                        <AlertDescription>
                          Complex tables and charts may not be extracted with full fidelity.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Privacy Risk Tab */}
        <TabsContent value="privacy">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Risk Assessment</CardTitle>
                <CardDescription>Evaluation of data privacy and security</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center p-6">
                      <div className={`text-4xl font-bold py-4 px-8 rounded-full ${privacyRiskColors[dashboardData.privacyRisk.overall as keyof typeof privacyRiskColors]} bg-opacity-20 border-2 ${privacyRiskColors[dashboardData.privacyRisk.overall as keyof typeof privacyRiskColors]}`}>
                        {dashboardData.privacyRisk.overall} Risk
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 p-4 border rounded-md">
                        <h3 className="font-semibold flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" /> 
                          PII Detection
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Personally identifiable information detected in documents
                        </p>
                        <div className="flex justify-between items-center">
                          <span>Detected instances:</span>
                          <Badge variant={dashboardData.privacyRisk.piiDetected > 5 ? "destructive" : "outline"}>
                            {dashboardData.privacyRisk.piiDetected}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2 p-4 border rounded-md">
                        <h3 className="font-semibold flex items-center">
                          <AlertOctagon className="h-4 w-4 mr-2 text-red-500" /> 
                          Content Warnings
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Potentially sensitive content detected
                        </p>
                        <div className="flex justify-between items-center">
                          <span>Warning flags:</span>
                          <Badge variant={dashboardData.privacyRisk.sensitiveContentWarnings > 0 ? "destructive" : "outline"}>
                            {dashboardData.privacyRisk.sensitiveContentWarnings}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-md">
                      <h3 className="font-semibold flex items-center mb-2">
                        <ShieldCheck className="h-4 w-4 mr-2 text-green-500" /> 
                        Data Retention Compliance
                      </h3>
                      <div className="flex justify-between items-center">
                        <span>Status:</span>
                        <Badge variant={dashboardData.privacyRisk.dataRetentionCompliance === "Compliant" ? "outline" : "destructive"}>
                          {dashboardData.privacyRisk.dataRetentionCompliance}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-md">
                      <h3 className="font-semibold mb-2">Recommendations</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {dashboardData.privacyRisk.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Data Handling Policies</CardTitle>
                <CardDescription>How the system manages and protects data</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium mb-1">Data Storage</h4>
                      <p className="text-sm">All data is stored locally within the system. No data is transmitted to external services except during transcription via OpenAI API.</p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium mb-1">Data Retention</h4>
                      <p className="text-sm">Documents are retained until manually deleted by users. Automated cleanup policies can be configured.</p>
                    </div>
                    
                    <div className="p-3 border rounded-md">
                      <h4 className="font-medium mb-1">API Services</h4>
                      <p className="text-sm">The system uses OpenAI services for audio transcription which may retain data according to their privacy policy.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest document processing events</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {dashboardData.activityLog.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-md mb-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {getTypeIcon(activity.type)}
                          <span className="font-medium">{activity.filename}</span>
                        </div>
                        <div className="ml-2">
                          {getStatusBadge(activity.status)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2 md:mt-0">
                        {formatDate(activity.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                Showing the 5 most recent activities
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}