/**
 * ResumeViewer Component
 * Displays PDF resume from Google Drive with fallback handling
 */

"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { SITE_CONFIG } from "@/config/site";

// Use Google Drive's direct download URL which works better for public PDFs
const PDF_DOWNLOAD_URL = `https://drive.google.com/uc?export=download&id=${SITE_CONFIG.resumeFileId}`;
// Use Google Docs Viewer as it handles authentication better
const PDF_VIEWER_URL = `https://docs.google.com/viewer?url=${encodeURIComponent(
  PDF_DOWNLOAD_URL
)}&embedded=true`;
const LOADING_TIMEOUT_MS = 15000; // Increased to 15s
const MAX_RETRIES = 2;

export function ResumeViewer(): React.ReactElement {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [key, setKey] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedRef = useRef(false);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    loadedRef.current = false;
    setRetryCount((prev) => prev + 1);
    setKey((prev) => prev + 1); // Force iframe reload
  }, []);

  useEffect(() => {
    loadedRef.current = false;

    // Set a timeout to detect loading failures
    timeoutRef.current = setTimeout(() => {
      if (!loadedRef.current) {
        setIsLoading(false);
        // Auto-retry if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES) {
          console.warn(
            `Resume loading timeout. Auto-retry ${
              retryCount + 1
            }/${MAX_RETRIES}`
          );
          handleRetry();
        } else {
          console.error("Resume loading failed after multiple retries");
          setHasError(true);
        }
      }
    }, LOADING_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, retryCount, handleRetry]);

  const handleIframeLoad = () => {
    loadedRef.current = true;
    setIsLoading(false);
    setHasError(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleIframeError = () => {
    loadedRef.current = true;
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Auto-retry on error if we haven't exceeded max retries
    if (retryCount < MAX_RETRIES) {
      console.warn(
        `Resume loading error. Auto-retry ${retryCount + 1}/${MAX_RETRIES}`
      );
      setTimeout(() => handleRetry(), 1000); // Small delay before retry
    } else {
      console.error("Resume loading failed after multiple retries");
      setHasError(true);
    }
  };

  return (
    <div className="w-full max-w-5xl h-full p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl h-full border border-gray-300 rounded-lg overflow-hidden shadow-lg mb-4 relative">
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="mb-1">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
              </div>
              <p className="text-sm text-gray-600">
                Loading {SITE_CONFIG.fullName}&apos;s resume...
              </p>
              {retryCount > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Retry attempt {retryCount}/{MAX_RETRIES}
                </p>
              )}
            </div>
          </div>
        )}
        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center px-4">
              <p className="text-sm text-gray-600 mb-4">
                Unable to display PDF in browser.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Try Again
                </button>
                <a
                  href={`https://drive.google.com/file/d/${SITE_CONFIG.resumeFileId}/view?usp=sharing`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors text-sm"
                >
                  Open in Google Drive
                </a>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            key={key}
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
