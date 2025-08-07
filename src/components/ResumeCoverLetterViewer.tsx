"use client";

import { useEffect, useState } from "react";

export default function ResumeCoverLetterViewer() {
  // Google Drive file ID extracted from the provided URL
  const googleDriveFileId = "1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp";
  
  // Google Drive URLs for different purposes
  const pdfEmbedUrl = `https://drive.google.com/file/d/${googleDriveFileId}/preview`;
  const pdfDownloadUrl = `https://drive.google.com/uc?export=download&id=${googleDriveFileId}`;
  const pdfViewUrl = `https://drive.google.com/file/d/${googleDriveFileId}/view`;
  
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to stop loading indicator if iframe doesn't trigger onLoad
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 seconds timeout for loading indicator only

    return () => clearTimeout(timer);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
    // Simply set loading to false when iframe loads
    // Don't try to access cross-origin iframe content
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
            📄 The PDF preview may be blocked by your browser&apos;s security settings. 
            <br />
            Please use the buttons below to view or download the resume.
          </div>
          <div className="flex gap-2 items-center justify-center">
            <a
              href={pdfDownloadUrl}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              📄 Download PDF
            </a>
            <a
              href={pdfViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              🔗 Open in New Tab
            </a>
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
          src={pdfEmbedUrl}
          title="Resume PDF"
          className="w-full h-full"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="autoplay"
        />
      </div>

      <div className="text-center">
        <div className="flex gap-2 items-center justify-center">
          <a
            href={pdfDownloadUrl}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            📄 Download PDF
          </a>
          <a
            href={pdfViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            🔗 Open in New Tab
          </a>
        </div>
      </div>
    </div>
  );
}

