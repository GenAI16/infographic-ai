/* eslint-disable @next/next/no-img-element */
import React from 'react';

interface PreviewCanvasProps {
  imageUrl: string | null;
  isLoading: boolean;
}

export function PreviewCanvas({ imageUrl, isLoading }: PreviewCanvasProps) {
  const downloadImage = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
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
      alert('Failed to download image. It might be blocked by CORS or the browser.');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-white/90 px-4 py-3 backdrop-blur-sm border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">Preview</h3>
          {imageUrl && (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              Generated
            </span>
          )}
        </div>

        {/* Canvas Content */}
        <div className="flex h-full w-full items-center justify-center bg-gray-50 p-4 pt-16">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
              <p className="text-sm text-gray-500 animate-pulse">Designing your infographic...</p>
            </div>
          ) : imageUrl ? (
            <div className="relative h-full w-full max-w-md overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5 transition-all hover:shadow-xl">
              <img
                src={imageUrl}
                alt="Generated Infographic Preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-6">
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Ready to Create</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                Fill in the details on the left and click "Generate Infographic" to see your preview here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={downloadImage}
          disabled={!imageUrl || isLoading}
          className={`
            inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            ${!imageUrl || isLoading
              ? 'cursor-not-allowed bg-gray-100 text-gray-400'
              : 'bg-white text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 hover:text-gray-900'
            }
          `}
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PNG
        </button>
      </div>
    </div>
  );
}
