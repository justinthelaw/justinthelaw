"use client";

import { useEffect, useState } from "react";

export default function ResumeCoverLetterViewer() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const pdfUrl =
    "https://drive.google.com/uc?export=download&id=1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp";
  const driveUrl =
    "https://drive.google.com/file/d/1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp/view";

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
      <div className="w-full max-w-4xl h-full border border-gray-300 rounded-lg overflow-hidden shadow-lg mb-4">
        <embed
          src={pdfUrl}
          type="application/pdf"
          width="100%"
          height="100%"
          className="w-full h-full"
        />
      </div>

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
            href={driveUrl}
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

