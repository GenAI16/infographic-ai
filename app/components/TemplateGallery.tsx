import React, { useState } from 'react';

const TABS = ['All', 'Timeline', 'Process', 'Informational', 'Statistical', 'Comparison', 'Human Resources', 'Business', 'Environment'];

export function TemplateGallery() {
  const [activeTab, setActiveTab] = useState('Business');

  return (
    <div className="w-full max-w-7xl mx-auto mt-16 px-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Browse through Infographic Templates</h2>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === tab 
                ? 'bg-white text-blue-600 shadow-sm border border-blue-100 ring-1 ring-blue-500/20' 
                : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid - Placeholder Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="group relative aspect-[3/4] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <div className={`absolute inset-0 bg-slate-100 ${i % 2 === 0 ? 'bg-orange-50' : 'bg-blue-50'}`}>
              {/* Abstract Preview Shape */}
              <div className="absolute inset-4 bg-white/50 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 text-sm font-medium">Template {i}</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800 truncate">Business Growth Strategy</h3>
              <p className="text-xs text-slate-500">Free • 12k uses</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
