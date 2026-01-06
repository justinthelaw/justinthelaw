/**
 * ResumeViewer Component
 * Displays PDF resume from Google Drive with fallback handling
 */

"use client";

import React, { useEffect, useState } from "react";
import { SITE_CONFIG } from "@/config/site";

// Use Google Drive's direct download URL which works better for public PDFs
const PDF_DOWNLOAD_URL = `https://drive.google.com/uc?export=download&id=${SITE_CONFIG.resumeFileId}`;
// Use Google Docs Viewer as it handles authentication better
const PDF_VIEWER_URL = `https://docs.google.com/viewer?url=${encodeURIComponent(
  PDF_DOWNLOAD_URL
)}&embedded=true`;
const LOADING_TIMEOUT_MS = 10000;

export function ResumeViewer(): React.ReactElement {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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
    setHasError(true);
  };

  return (
    <div className="w-full max-w-5xl h-full p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl h-full border border-gray-300 rounded-lg overflow-hidden shadow-lg mb-4 relative">
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="text-gray-500">
                Loading {SITE_CONFIG.fullName}&apos;s resume...
              </div>
            </div>
          </div>
        )}
        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center mt-2">
              <p className="text-sm text-gray-600">
                Unable to display PDF in browser. You can download{" "}
                {SITE_CONFIG.fullName}&apos;s resume{" "}
                <a
                  href={`https://drive.google.com/file/d/${SITE_CONFIG.resumeFileId}/view?usp=sharing`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  here
                </a>
                .
              </p>
            </div>
          </div>
        ) : (
          <iframe
            src={PDF_VIEWER_URL}
            title="Resume PDF"
            className="w-full h-full"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="autoplay"
          />
        )}
      </div>
    </div>
  );
}
