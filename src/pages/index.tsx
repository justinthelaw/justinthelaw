import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  // NOTE: Prevents hydration mismatch by ensuring client-side only changes
  const [isClient, setIsClient] = useState(false);
  const [path, setPath] = useState("");

  useEffect(() => {
    setIsClient(true);
    if (process.env.NODE_ENV === "production") {
      setPath(
        "https://raw.githubusercontent.com/justinthelaw/justinthelaw/refs/heads/main/public"
      );
    }
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 overflow-hidden">
      <div className="text-center text-5xl font-bold">Justin Law</div>
      {/* NOTE: Prevents hydration issue when rendering iframe */}
      {isClient && (
        <>
          <main className="row-start-2 flex flex-col items-center justify-center w-full flex-grow">
            <div
              className="w-[100%] max-w-[1500px] flex-grow flex"
              style={{ height: "75vh" }}
            >
              <iframe
                src="https://drive.google.com/file/d/1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp/preview"
                className="w-full h-full border rounded-md shadow-lg"
                title="Justin Law's Resume"
              />
            </div>
          </main>

          <footer className="row-start-3 flex gap-7 flex-wrap items-center justify-center">
            <a
              href="https://github.com/justinthelaw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={`${path}/github.png`}
                alt="GitHub icon"
                width={30}
                height={30}
              />
            </a>
            <a
              href="https://www.linkedin.com/in/justinwingchunglaw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={`${path}/linkedin.png`}
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
                src={`${path}/huggingface.png`}
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
              <Image
                src={`${path}/gitlab.png`}
                alt="GitLab icon"
                width={30}
                height={30}
              />
            </a>
          </footer>
        </>
      )}
    </div>
  );
}
