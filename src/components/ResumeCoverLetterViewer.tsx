"use client";

export default function ResumeCoverLetterViewer() {
  // Since Google Drive iframe embedding is now blocked by most browsers,
  // we'll go directly to the fallback solution that provides a better UX
  const fallbackUrl = "https://drive.google.com/file/d/1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp/view";

  return (
    <div className="w-full max-w-5xl h-full p-4 flex flex-col items-center justify-center">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Resume Viewer</h3>
        <p className="text-gray-600 mb-6 max-w-md">
          Due to browser security restrictions, the resume cannot be displayed inline. 
          Please click the button below to view it in a new tab.
        </p>
        <div className="space-y-3">
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📄 View Resume in New Tab
          </a>
          <p className="text-sm text-gray-500">
            Opens Justin Law&apos;s resume in Google Drive
          </p>
        </div>
      </div>
    </div>
  );
}
