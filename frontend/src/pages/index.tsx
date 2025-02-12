import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  // NOTE: Prevents hydration mismatch by ensuring client-side only changes
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 overflow-hidden">
      <div className="text-center text-5xl font-bold mb-8">Justin Law</div>

      <main className="row-start-2 flex flex-col items-center justify-center w-full flex-grow">
        <div
          className="w-[100%] max-w-[1500px] flex-grow flex"
          style={{ height: "75vh" }}
        >
          {/* NOTE: Prevents hydration issue when rendering iframe */}
          {isClient && (
            <iframe
              src="https://drive.google.com/file/d/1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp/preview"
              className="w-full h-full border rounded-md shadow-lg"
              title="Justin Law's Resume"
            />
          )}
        </div>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          href="https://github.com/justinthelaw"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src="/github.png" alt="GitHub icon" width={30} height={30} />
        </a>
        <a
          href="https://www.linkedin.com/in/justinwingchunglaw/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src="/linkedin.png"
            alt="LinkedIn icon"
            width={30}
            height={30}
          />
        </a>
        <a
          href="https://huggingface.co/justinthelaw"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src="/huggingface.png"
            alt="Hugging Face icon"
            width={30}
            height={30}
          />
        </a>
        <a
          href="https://repo1.dso.mil/justinthelaw"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src="/gitlab.png" alt="GitLab icon" width={30} height={30} />
        </a>
      </footer>
    </div>
  );
}
