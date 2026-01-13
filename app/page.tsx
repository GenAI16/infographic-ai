'use client';

import { useState } from 'react';
import { HeroHeader } from './components/HeroHeader';
import { PromptInput } from './components/PromptInput';
import { TrustBadges } from './components/TrustBadges';
import { TemplateGallery } from './components/TemplateGallery';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedImage(null);

    // Simulate AI Generation Delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate deterministic random image based on topic length
    const seed = topic.length > 0 ? topic.replace(/\s/g, '') : 'infographic';
    const width = 800;
    const height = 1200;
    const randomSuffix = Math.floor(Math.random() * 1000);
    const imageUrl = `https://picsum.photos/seed/${seed}-${randomSuffix}/${width}/${height}`;

    setGeneratedImage(imageUrl);
    setIsLoading(false);
    
    // Scroll to result
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const downloadImage = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `infographic-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. CORS restrictions might apply to this placeholder.');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Navbar Placeholder */}
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
         <div className="flex gap-3">
             <button className="text-slate-600 font-medium hover:text-slate-900 px-3 py-2">Log in</button>
             <button className="bg-slate-900 text-white px-4 py-2 rounded-full font-medium hover:bg-slate-800 transition-colors">Sign up</button>
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

      {/* Result Section (conditionally rendered) */}
      {generatedImage && (
        <section id="result-section" className="py-12 bg-slate-50 border-y border-slate-200">
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Generated Infographic</h2>
              <div className="bg-white p-4 rounded-xl shadow-lg inline-block">
                 <img 
                   src={generatedImage} 
                   alt="Generated Infographic" 
                   className="max-h-[600px] w-auto rounded-lg shadow-sm"
                 />
              </div>
              <div className="mt-6 flex justify-center gap-4">
                 <button 
                   onClick={() => setGeneratedImage(null)}
                   className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                 >
                   Discard
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
