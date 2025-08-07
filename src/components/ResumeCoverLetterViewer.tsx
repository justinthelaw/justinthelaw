"use client";

import { useEffect, useRef, useState } from "react";
import {
  GlobalWorkerOptions,
  getDocument,
  version as pdfjsVersion,
} from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

const PDF_URL =
  "https://drive.google.com/uc?export=download&id=1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp";

export default function ResumeCoverLetterViewer() {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    const fetchPdf = async () => {
      try {
        const response = await fetch(PDF_URL);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
      } catch (error) {
        console.error("Failed to load PDF", error);
        setError("Failed to load PDF");
      }
    };

    fetchPdf();
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (!pdfBlobUrl || !viewerRef.current) return;

    const renderPdf = async () => {
      const pdf = await getDocument(pdfBlobUrl).promise;
      const container = viewerRef.current!;
      container.innerHTML = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });
        const scale = container.clientWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        container.appendChild(canvas);
        await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
      }
    };

    renderPdf();
  }, [pdfBlobUrl]);

  if (error) {
    return (
      <div className="w-full max-w-5xl h-full p-4 flex flex-col items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Resume</h3>
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

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
      <div
        ref={viewerRef}
        className="w-full max-w-4xl h-full border border-gray-300 rounded-lg overflow-auto shadow-lg mb-4"
      />

      <div className="text-center">
        <div className="flex gap-2 items-center justify-center">
          <a
            href={pdfBlobUrl}
            download="Justin_Law_Resume.pdf"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            📄 Download PDF
          </a>
          <a
            href={pdfBlobUrl}
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

