import React from 'react';

export type InfographicStyle = 'Modern' | 'Minimal' | 'Corporate' | 'Creative';
export type ColorScheme = 'Blue/Gray' | 'Purple/Pink' | 'Green/Teal' | 'Black/White';

export interface FormData {
  topic: string;
  dataPoints: string;
  style: InfographicStyle;
  colorScheme: ColorScheme;
}

interface InputPanelProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

const STYLES: InfographicStyle[] = ['Modern', 'Minimal', 'Corporate', 'Creative'];
const COLORS: { name: ColorScheme; class: string }[] = [
  { name: 'Blue/Gray', class: 'bg-gradient-to-br from-blue-500 to-gray-600' },
  { name: 'Purple/Pink', class: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { name: 'Green/Teal', class: 'bg-gradient-to-br from-green-500 to-teal-500' },
  { name: 'Black/White', class: 'bg-gradient-to-br from-gray-900 to-gray-100 border border-gray-200' },
];

export function InputPanel({ formData, setFormData }: InputPanelProps) {
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-full space-y-6 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Content & Style</h2>
        
        {/* Topic Input */}
        <div className="mb-5">
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            Topic / Title
          </label>
          <input
            type="text"
            id="topic"
            placeholder="e.g. Benefits of Remote Work"
            value={formData.topic}
            onChange={(e) => handleChange('topic', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Data Points Textarea */}
        <div className="mb-5">
          <label htmlFor="dataPoints" className="block text-sm font-medium text-gray-700 mb-1">
            Data Points (one per line)
          </label>
          <textarea
            id="dataPoints"
            rows={5}
            placeholder="• Increased flexibility&#10;• Better work-life balance&#10;• Reduced commuting time"
            value={formData.dataPoints}
            onChange={(e) => handleChange('dataPoints', e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">Enter 3-5 key points for best results.</p>
        </div>

        {/* Style Selector */}
        <div className="mb-5">
          <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-1">
            Visual Style
          </label>
          <div className="relative">
            <select
              id="style"
              value={formData.style}
              onChange={(e) => handleChange('style', e.target.value as InfographicStyle)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            >
              {STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Color Scheme Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Palette
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => handleChange('colorScheme', color.name)}
                className={`
                  group relative flex h-12 w-full items-center justify-center rounded-lg shadow-sm transition-all hover:scale-105 hover:shadow-md
                  ${formData.colorScheme === color.name ? 'ring-2 ring-indigo-500 ring-offset-2' : 'ring-1 ring-gray-200'}
                `}
                title={color.name}
              >
                <div className={`absolute inset-0 rounded-lg opacity-80 ${color.class}`} />
                {formData.colorScheme === color.name && (
                  <svg className="relative z-10 h-5 w-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
