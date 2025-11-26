/**
 * ResumeViewer Component
 * Displays PDF resume from Google Drive with fallback handling
 */

'use client';

import React, { useEffect, useState } from 'react';
import { SITE_CONFIG } from '@/config/site';

const PDF_EMBED_URL = `https://drive.google.com/file/d/${SITE_CONFIG.resumeFileId}/preview`;
const LOADING_TIMEOUT_MS = 10000;

export function ResumeViewer(): React.ReactElement {
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to stop loading indicator if iframe doesn't trigger onLoad
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, LOADING_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setShowFallback(true);
  };

  if (showFallback) {
    return (
      <div className="w-full max-w-5xl h-full p-4 flex flex-col items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Resume</h3>
          <div className="text-gray-500 mb-4">
            📄 The PDF preview may be blocked by your browser&apos;s security
            settings.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl h-full p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl h-full border border-gray-300 rounded-lg overflow-hidden shadow-lg mb-4 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Resume</h3>
              <div className="text-gray-500">Loading PDF...</div>
            </div>
          </div>
        )}
        <iframe
          src={PDF_EMBED_URL}
          title="Resume PDF"
          className="w-full h-full"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="autoplay"
        />
      </div>
    </div>
  );
}
