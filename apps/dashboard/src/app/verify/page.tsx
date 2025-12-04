'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Upload, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VerifyPage() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [manifestFile, setManifestFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
      } else if (file.name.endsWith('.c2pa')) {
        setManifestFile(file);
      }
    });
  };

  const handleVerify = async () => {
    if (!imageFile || !manifestFile) {
      setError('Please upload both an image and its .c2pa manifest file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('manifest', manifestFile);

      const response = await fetch('/api/verify-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const result = await response.json();
      
      // Redirect to results page
      router.push(`/verify/${result.verificationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-bold text-xl">PoPC Verifier</span>
          </Link>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:underline">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Verify Image Authenticity</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Upload a photo and its C2PA manifest to verify it hasn't been tampered with
            </p>
          </div>

          {/* Upload Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            {/* Drag and Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center transition-all
                ${isDragging 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }
              `}
            >
              <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Drop files here</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                or click to select files
              </p>
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,.c2pa"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button asChild variant="outline">
                <label htmlFor="file-upload" className="cursor-pointer">
                  Browse Files
                </label>
              </Button>
            </div>

            {/* File Status */}
            <div className="mt-8 space-y-4">
              {/* Image File */}
              <div className={`
                p-4 rounded-lg border-2 transition-all
                ${imageFile 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
                }
              `}>
                <div className="flex items-center gap-3">
                  <ImageIcon className={`h-6 w-6 ${imageFile ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <p className="font-medium">
                      {imageFile ? imageFile.name : 'No image selected'}
                    </p>
                    {imageFile && (
                      <p className="text-sm text-gray-500">
                        {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                  {imageFile && (
                    <div className="text-green-600 font-bold">✓</div>
                  )}
                </div>
              </div>

              {/* Manifest File */}
              <div className={`
                p-4 rounded-lg border-2 transition-all
                ${manifestFile 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
                }
              `}>
                <div className="flex items-center gap-3">
                  <FileText className={`h-6 w-6 ${manifestFile ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <p className="font-medium">
                      {manifestFile ? manifestFile.name : 'No manifest (.c2pa) selected'}
                    </p>
                    {manifestFile && (
                      <p className="text-sm text-gray-500">
                        {(manifestFile.size / 1024).toFixed(2)} KB
                      </p>
                    )}
                  </div>
                  {manifestFile && (
                    <div className="text-green-600 font-bold">✓</div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Verify Button */}
            <div className="mt-8">
              <Button
                onClick={handleVerify}
                disabled={!imageFile || !manifestFile || isUploading}
                className="w-full h-14 text-lg"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Verify Authenticity
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              What is a C2PA manifest?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              A C2PA manifest (.c2pa file) is a cryptographic signature file that proves an image 
              was captured by a trusted device and hasn't been edited. Photos captured with the 
              PoPC app automatically generate this manifest file alongside the image.
            </p>
          </div>

          {/* How it Works */}
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              This verification uses cryptographic signatures to ensure image authenticity.
              <br />
              No data is stored permanently - verifications are retained for 30 days.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

