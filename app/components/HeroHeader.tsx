import React from 'react';

export function HeroHeader() {
  return (
    <div className="text-center space-y-4 mb-10">
      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
        Free AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Infographic</span> Generator
      </h1>
      <p className="max-w-2xl mx-auto text-lg text-slate-600">
        Create infographics instantly from simple text prompts, turning complex data into clear, engaging visual stories
      </p>
    </div>
  );
}
