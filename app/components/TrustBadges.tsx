import React from 'react';

export function TrustBadges() {
  // Using text placeholders styled to look like the logos in the image for simplicity
  // In a real app, these would be SVGs
  return (
    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 py-12 opacity-90">
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold text-slate-700 flex items-center gap-1">
          <span className="text-blue-500">G</span>
          <span className="text-red-500">o</span>
          <span className="text-yellow-500">o</span>
          <span className="text-blue-500">g</span>
          <span className="text-green-500">l</span>
          <span className="text-red-500">e</span>
        </span>
        <div className="flex items-center gap-1">
          <div className="flex text-yellow-400 text-sm">★★★★★</div>
          <span className="text-slate-900 font-bold text-sm">4.8/5</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold text-red-500 flex items-center gap-1">
          G<span className="text-slate-700">2</span> <span className="text-red-500 text-lg uppercase tracking-wider">Crowd</span>
        </span>
        <div className="flex items-center gap-1">
          <div className="flex text-yellow-400 text-sm">★★★★★</div>
          <span className="text-slate-900 font-bold text-sm">4.7/5</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold text-slate-800 flex items-center gap-1">
          <span className="text-blue-600">▼</span> Capterra
        </span>
        <div className="flex items-center gap-1">
          <div className="flex text-yellow-400 text-sm">★★★★★</div>
          <span className="text-slate-900 font-bold text-sm">4.6/5</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold text-slate-900 flex items-center gap-1">
          <span className="text-green-500">★</span> Trustpilot
        </span>
        <div className="flex items-center gap-1">
          <div className="flex text-yellow-400 text-sm">★★★★★</div>
          <span className="text-slate-900 font-bold text-sm">4.8/5</span>
        </div>
      </div>
    </div>
  );
}
