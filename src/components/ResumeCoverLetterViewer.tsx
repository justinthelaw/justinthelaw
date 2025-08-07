"use client";

import { useEffect, useState } from "react";

export default function ResumeCoverLetterViewer() {
  const pdfUrl =
    process.env.NEXT_PUBLIC_RESUME_PDF_URL ||
    "https://raw.githubusercontent.com/justinthelaw/resume/main/Justin_Law_Resume.pdf";
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        setPdfBlobUrl(URL.createObjectURL(blob));
      } catch (error) {
        console.error("Failed to load PDF", error);
      }
    };

    fetchPdf();
  }, [pdfUrl]);

  if (!pdfBlobUrl) {
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
        <iframe
          src={pdfBlobUrl}
          title="Resume PDF"
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
            href={pdfUrl}
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

