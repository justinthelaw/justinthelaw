"use client";

import { useState, useEffect } from "react";

export default function ResumeCoverLetterViewer() {
  const [showEmbedded, setShowEmbedded] = useState(true);
  const [embedError, setEmbedError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Google Drive direct download URL
  const pdfUrl =
    "https://drive.google.com/uc?export=download&id=1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp";

  // Alternative embed URL format
  const embedUrl =
    "https://drive.google.com/file/d/1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp/preview";

  // Fallback URL for manual viewing
  const fallbackUrl =
    "https://drive.google.com/file/d/1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp/view";

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleEmbedError = () => {
    setEmbedError(true);
    setShowEmbedded(false);
  };

  if (!isClient) {
    return (
      <div className="w-full max-w-5xl h-full p-4 flex flex-col items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Resume</h3>
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl h-full p-4 flex flex-col items-center">
      {showEmbedded && !embedError && (
        <div className="w-full max-w-4xl h-full border border-gray-300 rounded-lg overflow-hidden shadow-lg mb-4">
          <object
            data={embedUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            onError={handleEmbedError}
            className="w-full h-full"
          >
            <embed
              src={embedUrl}
              type="application/pdf"
              width="100%"
              height="100%"
              onError={handleEmbedError}
            />
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <p className="text-gray-600 mb-4">
                Your browser doesn&apos;t support PDF viewing. Please use the
                download or view buttons above.
              </p>
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                📄 View Resume in Google Drive
              </a>
            </div>
          </object>
        </div>
      )}

      {embedError && (
        <div className="w-full max-w-4xl p-8 border border-gray-300 rounded-lg text-center bg-gray-50">
          <p className="text-gray-600 mb-4">
            Unable to display the PDF directly due to browser restrictions.
            Please use the download or view buttons above to access the resume.
          </p>
          <div className="space-y-2">
            <a
              href={pdfUrl}
              download="Justin_Law_Resume.pdf"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-2"
            >
              📄 Download PDF
            </a>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔗 View in Google Drive
            </a>
          </div>
        </div>
      )}

      <div className="text-center">
        <div className="flex gap-2 items-center justify-center">
          <a
            href={pdfUrl}
            download="Justin_Law_Resume.pdf"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            📄 Download PDF
          </a>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            🔗 View in Drive
          </a>
        </div>
      </div>
    </div>
  );
}
