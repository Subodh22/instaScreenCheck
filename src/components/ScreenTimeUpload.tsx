'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Upload, Camera, Database, Loader2, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';
import { analyzeScreenTimeWithAI, createManualScreenTimeData, ExtractedScreenTimeData } from '../lib/aiOcrUtils';
import { useAuth } from '../lib/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

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
      if (!uploadedImage) {
        throw new Error('Please upload a screenshot first');
      }
      
      // Process uploaded image with AI
      const processedData = await analyzeScreenTimeWithAI(uploadedImage);
      setAiResponse('Successfully uploaded!');
      
      // Automatically upload to database
      await saveToSupabase(processedData);
      
    } catch (error) {
      console.error('Error processing image:', error);
      alert(error instanceof Error ? error.message : 'Error processing image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToSupabase = async (data?: ExtractedScreenTimeData) => {
    const dataToSave = data || extractedData;
    if (!dataToSave) return;
    
    try {
      const response = await fetch('/api/screen-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dataToSave.date,
          total_time: dataToSave.totalTime,
          apps: dataToSave.apps,
          categories: dataToSave.categories,
          updated_at: dataToSave.updatedAt,
          user_id: user?.uid || 'anonymous' // Use authenticated user ID
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save data');
      }
      
      // Success message is handled by setAiResponse above
      
      // Call the success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
      // Reset form
      setUploadedImage(null);
      setExtractedData(null);
      
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
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                <HelpCircle className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto bg-white rounded-2xl shadow-2xl border-0 p-6">
              <DialogHeader className="text-center mb-4">
                <DialogTitle className="text-lg font-bold text-gray-800">📱 Screenshot Guide</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <Image
                      src="/iphone-screen-time-example.png"
                      alt="iPhone Screen Time Screenshot Example"
                      width={180}
                      height={360}
                      className="rounded-xl border-2 border-gray-200 shadow-lg object-cover"
                      onError={(e) => {
                        // Hide the image and show fallback text if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                    <div className="hidden bg-gradient-to-b from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-gray-200 shadow-lg" style={{width: '180px', height: '360px'}}>
                      <div className="text-center space-y-2 h-full flex flex-col justify-center">
                        <div className="text-xs text-gray-500">📱 iPhone Screen Time Example</div>
                        <div className="bg-white p-2 rounded-lg border shadow-sm">
                          <div className="text-center space-y-1">
                            <div className="text-sm font-bold">SCREEN TIME</div>
                            <div className="text-xs text-gray-600">Today, 2 August</div>
                            <div className="text-lg font-bold text-blue-600">5h 35m</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-semibold text-gray-800">
                      Upload your iPhone Screen Time screenshot
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Make sure it shows the total time and app breakdown like this example
                    </p>
                  </div>
                </div>

              </div>
            </DialogContent>
          </Dialog>
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
              {isUploading ? 'Uploading...' : 'Choose Screenshot'}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
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

          {/* Process Button */}
          <Button
            onClick={processImage}
            disabled={!uploadedImage}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? 'Uploading...' : 'Upload'}
          </Button>
        </div>

        {/* AI Response Display */}
        {aiResponse && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-700">Upload Status</h4>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">{aiResponse}</p>
            </div>
          </div>
        )}


      </CardContent>
    </Card>
  );
} 