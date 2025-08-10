"use client";

import { useEffect, useState, useRef } from "react";

export default function ResumeCoverLetterViewer() {
  // Google Drive file ID extracted from the provided URL
  const googleDriveFileId = "1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp";
  
  // Multiple URL strategies for better reliability
  const pdfEmbedUrl = `https://drive.google.com/file/d/${googleDriveFileId}/preview`;
  const pdfDirectUrl = `https://drive.google.com/file/d/${googleDriveFileId}/view`;
  const pdfDownloadUrl = `https://drive.google.com/uc?id=${googleDriveFileId}&export=download`;
  
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // More intelligent fallback detection
    const checkIframeContent = () => {
      try {
        const iframe = iframeRef.current;
        if (!iframe) return;

        // Try to detect if iframe content is blocked
        // In many browsers, blocked iframes will have specific characteristics
        const checkBlocked = () => {
          try {
            // If we can access the iframe document, content may be loaded
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            
            // Check if document exists and has content
            if (iframeDoc && iframeDoc.body && iframeDoc.body.innerHTML.trim().length > 0) {
              const content = iframeDoc.body.innerHTML.toLowerCase();
              
              // Check for common blocked content indicators
              if (content.includes('blocked') || 
                  content.includes('denied') || 
                  content.includes('refused') ||
                  content.includes('error') ||
                  iframeDoc.body.children.length === 0) {
                return true;
              }
            }
            return false;
          } catch {
            // Cross-origin restrictions mean content might be loaded
            // This is actually a good sign for PDF content
            return false;
          }
        };

        if (checkBlocked()) {
          console.log('Iframe content appears to be blocked, showing fallback');
          setIsLoading(false);
          setShowFallback(true);
        }
      } catch (error) {
        // Silently handle any errors in content checking
        console.debug('Iframe content check error:', error);
      }
    };

    // Check after different intervals to catch various blocking scenarios
    const timers = [
      setTimeout(checkIframeContent, 3000),  // Quick check
      setTimeout(checkIframeContent, 6000),  // Medium check
      setTimeout(() => {
        // Final fallback if still loading after 10 seconds
        if (isLoading) {
          console.log('Iframe took too long to load, showing fallback');
          setIsLoading(false);
          setShowFallback(true);
        }
      }, 10000)
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [loadAttempts, isLoading]);

  const handleIframeLoad = () => {
    console.log('Iframe load event fired');
    setIsLoading(false);
    
    // Even if load event fires, content might still be blocked
    // Check again after a short delay
    setTimeout(() => {
      if (iframeRef.current) {
        try {
          const iframe = iframeRef.current;
          const rect = iframe.getBoundingClientRect();
          
          // If iframe has no meaningful dimensions, it might be blocked
          if (rect.height < 100 || rect.width < 100) {
            console.log('Iframe has minimal dimensions, possibly blocked');
            setShowFallback(true);
          }
        } catch (e) {
          console.debug('Iframe dimension check error:', e);
        }
      }
    }, 1000);
  };

  const handleIframeError = () => {
    console.log('Iframe error event fired');
    setIsLoading(false);
    setShowFallback(true);
  };

  // Retry loading with different URL if first attempt fails
  const retryWithDifferentUrl = () => {
    if (loadAttempts < 2) {
      setLoadAttempts(prev => prev + 1);
      setIsLoading(true);
      setShowFallback(false);
    }
  };

  const getIframeSrc = () => {
    switch (loadAttempts) {
      case 0:
        return pdfEmbedUrl;
      case 1:
        return `${pdfEmbedUrl}?usp=sharing`;
      case 2:
        return `${pdfEmbedUrl}?embedded=true`;
      default:
        return pdfEmbedUrl;
    }
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
            
            {/* Additional download option */}
            <a 
              href={pdfDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 inline-flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </a>
            
            {loadAttempts < 2 && (
              <button
                onClick={retryWithDifferentUrl}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 inline-flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            )}
            
            <p className="text-sm text-gray-400">
              Click above to open the PDF in a new tab{loadAttempts < 2 ? ' or try reloading' : ''}
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
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10" data-testid="resume-loading">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Resume</h3>
              <div className="text-gray-500 flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading PDF...
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Attempt {loadAttempts + 1} of 3
              </div>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          key={loadAttempts} // Force re-render on retry
          src={getIframeSrc()}
          title="Resume PDF"
          className="w-full h-full"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="autoplay"
          loading="eager"
          data-testid="resume-iframe"
        />
      </div>
    </div>
  );
}

