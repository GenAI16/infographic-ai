'use client';

import { useState } from 'react';
import { HeroHeader } from './components/HeroHeader';
import { PromptInput } from './components/PromptInput';
import { TrustBadges } from './components/TrustBadges';
import { TemplateGallery } from './components/TemplateGallery';
import { UserNav } from './components/UserNav';
import { CreditsDisplay } from './components/CreditsDisplay';
import { generateInfographic, GenerationResult } from './actions/generateInfographic';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creditsRefresh, setCreditsRefresh] = useState(0);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsLoading(true);
    setGeneratedImage(null);
    setAiResponse(null);
    setError(null);

    try {
      // Call the real Gemini AI API
      const result: GenerationResult = await generateInfographic(topic, '9:16', '2K');
      
      if (result.success) {
        // Prefer storage URL if available, fallback to base64
        if (result.imageUrl) {
          setGeneratedImage(result.imageUrl);
        } else if (result.imageBase64) {
          // Create a data URL from the base64 image
          const dataUrl = `data:${result.mimeType || 'image/png'};base64,${result.imageBase64}`;
          setGeneratedImage(dataUrl);
        }
        
        if (result.textResponse) {
          setAiResponse(result.textResponse);
        }
        
        // Refresh credits display
        setCreditsRefresh(prev => prev + 1);
      } else {
        setError(result.error || 'Failed to generate infographic. Please try again.');
        
        // Refresh credits in case of refund
        setCreditsRefresh(prev => prev + 1);
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      
      // Scroll to result after a brief delay
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;
    
    try {
      // Check if it's a URL or data URL
      if (generatedImage.startsWith('http')) {
        // For storage URLs, fetch and download
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `infographic-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // For data URLs, we can directly create a download link
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `infographic-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">IG</div>
          <span className="font-bold text-xl text-slate-800">Infographic.ai</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-slate-900">Templates</a>
          <a href="#" className="hover:text-slate-900">Features</a>
          <a href="#" className="hover:text-slate-900">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <CreditsDisplay refreshTrigger={creditsRefresh} />
          <UserNav />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 max-w-5xl mx-auto flex flex-col items-center">
        <HeroHeader />
        
        <PromptInput 
          value={topic} 
          onChange={setTopic} 
          onGenerate={handleGenerate} 
          isLoading={isLoading} 
        />
        
        <TrustBadges />
      </section>

      {/* Error Message */}
      {error && (
        <section className="py-6 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-700 font-medium">{error}</p>
              <p className="text-red-500 text-sm mt-2">
                Make sure your GEMINI_API_KEY is set in .env.local
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {isLoading && (
        <section id="result-section" className="py-12 bg-slate-50 border-y border-slate-200">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Generating Your Infographic...</h2>
            <div className="bg-white p-8 rounded-xl shadow-lg inline-block">
              <div className="flex flex-col items-center gap-4">
                {/* Animated loading spinner */}
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-slate-600">AI is creating your infographic...</p>
                <p className="text-slate-400 text-sm">This may take 10-30 seconds</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Result Section */}
      {generatedImage && !isLoading && (
        <section id="result-section" className="py-12 bg-slate-50 border-y border-slate-200">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Generated Infographic</h2>
            {aiResponse && (
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">{aiResponse}</p>
            )}
            <div className="bg-white p-4 rounded-xl shadow-lg inline-block">
              <img 
                src={generatedImage} 
                alt="Generated Infographic" 
                className="max-h-[700px] w-auto rounded-lg shadow-sm"
              />
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <button 
                onClick={() => {
                  setGeneratedImage(null);
                  setAiResponse(null);
                }}
                className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={handleGenerate}
                className="px-6 py-2.5 rounded-lg border border-purple-300 text-purple-700 font-medium hover:bg-purple-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>
              <button 
                onClick={downloadImage}
                className="px-6 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Template Gallery Section */}
      <section className="py-12 bg-slate-50/50">
        <TemplateGallery />
      </section>
    </main>
  );
}
