'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Upload, Camera, Database, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';
import { analyzeScreenTimeWithAI, createManualScreenTimeData, ExtractedScreenTimeData } from '../lib/aiOcrUtils';
import { useAuth } from '../lib/hooks/useAuth';

interface ScreenTimeUploadProps {
  onUploadSuccess?: () => void;
}

export function ScreenTimeUpload({ onUploadSuccess }: ScreenTimeUploadProps) {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedScreenTimeData | null>(null);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [manualData, setManualData] = useState({
    totalTime: '',
    date: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    setIsProcessing(true);
    
    try {
      let processedData: ExtractedScreenTimeData;
      
      if (uploadedImage) {
        // Try AI-powered analysis for uploaded image
        console.log('Processing uploaded image with AI...');
        try {
          processedData = await analyzeScreenTimeWithAI(uploadedImage);
          setAiResponse('AI analysis completed successfully!');
        } catch (aiError) {
          console.error('AI analysis failed, falling back to manual data:', aiError);
          setAiResponse(`AI analysis failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`);
          // If AI fails, use manual data if available
          if (manualData.totalTime) {
            processedData = createManualScreenTimeData(
              manualData.totalTime,
              manualData.date,
              manualData.updatedAt
            );
          } else {
            throw new Error('AI analysis failed and no manual data available. Please enter the total screen time manually.');
          }
        }
      } else if (manualData.totalTime) {
        // Use manual data as fallback
        console.log('Using manual data entry...');
        processedData = createManualScreenTimeData(
          manualData.totalTime,
          manualData.date,
          manualData.updatedAt
        );
      } else {
        throw new Error('No image uploaded or manual data entered');
      }
      
      setExtractedData(processedData);
    } catch (error) {
      console.error('Error processing image:', error);
      alert(error instanceof Error ? error.message : 'Error processing image. Please try again or use manual input.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToSupabase = async () => {
    if (!extractedData) return;
    
    try {
      const response = await fetch('/api/screen-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: extractedData.date,
          total_time: extractedData.totalTime,
          apps: extractedData.apps,
          categories: extractedData.categories,
          updated_at: extractedData.updatedAt,
          user_id: user?.uid || 'anonymous' // Use authenticated user ID
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save data');
      }
      
      const message = result.source === 'serverStorage' 
        ? `Screen time data saved to server memory! ${result.message}`
        : result.source === 'supabase'
        ? 'Screen time data saved to database successfully!'
        : 'Screen time data saved successfully!';
      
      alert(message);
      
      // Call the success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
      // Reset form
      setUploadedImage(null);
      setExtractedData(null);
      setManualData({
        totalTime: '',
        date: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      });
      
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      alert('Error saving data. Please try again.');
    }
  };

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Camera className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold">Upload Screen Time Screenshot</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Please sign in to upload and track your screen time data
            </p>
            <Button
              onClick={signInWithGoogle}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold">Upload Screen Time Screenshot</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Signed in as: {user.email}
            </div>
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={openCamera}
              disabled={isUploading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              {isUploading ? 'Uploading...' : 'Take Screenshot'}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Image Preview */}
          {uploadedImage && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Uploaded Screenshot:</Label>
              <div className="relative">
                <Image 
                  src={uploadedImage} 
                  alt="Screen Time Screenshot" 
                  width={400}
                  height={192}
                  className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Manual Input Fallback */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="totalTime" className="text-sm font-medium">
              Total Screen Time (e.g., 5h 14m)
            </Label>
            <Input
              id="totalTime"
              value={manualData.totalTime}
              onChange={(e) => setManualData(prev => ({ ...prev, totalTime: e.target.value }))}
              placeholder="5h 14m"
            />
            
            <Label htmlFor="date" className="text-sm font-medium">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={manualData.date}
              onChange={(e) => setManualData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          {/* Process Button */}
          <Button
            onClick={processImage}
            disabled={!uploadedImage && !manualData.totalTime}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? 'Processing with AI...' : 'Process & Extract Data'}
          </Button>
        </div>

        {/* AI Response Display */}
        {aiResponse && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-700">AI Analysis Status</h4>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">{aiResponse}</p>
            </div>
          </div>
        )}

        {/* Extracted Data Display */}
        {extractedData && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-green-700">Extracted Data</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">Total Time:</span>
                <span className="font-bold text-green-700">{extractedData.totalTime}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">Date:</span>
                <span className="font-medium">{extractedData.date}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">Updated At:</span>
                <span className="font-medium">{extractedData.updatedAt}</span>
              </div>

              {/* Apps */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Most Used Apps:</h5>
                {extractedData.apps.map((app, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{app.name}</span>
                    <span className="text-sm font-medium">{app.time}</span>
                  </div>
                ))}
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Categories:</h5>
                {extractedData.categories.map((category, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{category.name}</span>
                    <span className="text-sm font-medium">{category.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={saveToSupabase}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Database className="h-4 w-4 mr-2" />
              Save to Database
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 