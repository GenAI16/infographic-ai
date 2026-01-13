import React from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export function PromptInput({ value, onChange, onGenerate, isLoading }: PromptInputProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative group rounded-2xl border border-purple-200 bg-white p-2 shadow-sm focus-within:border-purple-400 focus-within:ring-4 focus-within:ring-purple-100 transition-all">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe what you want to create..."
          rows={3}
          className="w-full resize-none bg-transparent px-4 py-3 text-lg text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-2 text-slate-400">
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" title="Ideas">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors" title="Attach file">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>

          <button
            onClick={onGenerate}
            disabled={isLoading || !value.trim()}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all
              ${isLoading || !value.trim()
                ? 'bg-purple-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 shadow-md hover:shadow-lg'
              }
            `}
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
