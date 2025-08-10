"use client";

import { useEffect, useState } from "react";

export default function ResumeCoverLetterViewer() {
  // Google Drive file ID extracted from the provided URL
  const googleDriveFileId = "1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp";
  
  // Google Drive URL for PDF preview
  const pdfEmbedUrl = `https://drive.google.com/file/d/${googleDriveFileId}/preview`;
  // Direct download URL for fallback
  const pdfDirectUrl = `https://drive.google.com/file/d/${googleDriveFileId}/view`;
  
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to show fallback if iframe content is blocked
    // This handles cases where iframe loads but content is blocked by browser
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
      setShowFallback(true);
    }, 5000); // 5 seconds timeout to show fallback for blocked content

    return () => clearTimeout(fallbackTimer);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
    // Note: We can't reliably detect if content is blocked due to CORS
    // The fallback timer will handle blocked content cases
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setShowFallback(true);
  };

  if (showFallback) {
    return (
      <div className="w-full max-w-5xl h-full p-4 flex flex-col items-center justify-center" data-testid="resume-fallback">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Resume</h3>
          <div className="text-gray-500 mb-4">
            📄 The PDF preview may be blocked by your browser&apos;s security settings.
          </div>
          <div className="flex flex-col gap-3">
            <a 
              href={pdfDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center justify-center gap-2"
              data-testid="resume-view-link"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Resume
            </a>
            <p className="text-sm text-gray-400">
              Click above to open the PDF in a new tab
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl h-full p-4 flex flex-col items-center" data-testid="resume-viewer">
      <div className="w-full max-w-4xl h-full border border-gray-300 rounded-lg overflow-hidden shadow-lg mb-4 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50" data-testid="resume-loading">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Resume</h3>
              <div className="text-gray-500">Loading PDF...</div>
            </div>
          </div>
        )}
        <iframe
          src={pdfEmbedUrl}
          title="Resume PDF"
          className="w-full h-full"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="autoplay"
          data-testid="resume-iframe"
        />
      </div>
    </div>
  );
}

