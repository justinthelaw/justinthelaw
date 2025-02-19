import Image from "next/image";
import { useEffect, useState } from "react";

interface LinkIconButton {
  link: string;
  altText: string;
  filename: string;
}

export default function LinkIconButton({
  link,
  altText,
  filename,
}: LinkIconButton) {
  const [path, setPath] = useState("");

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      setPath(
        "https://raw.githubusercontent.com/justinthelaw/justinthelaw/refs/heads/main/public"
      );
    }
  }, []);

  return (
    <a
      href={`${link}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="relative w-8 h-8">
        <Image
          src={`${path}/${filename}`}
          alt={`${altText}`}
          fill
          className="object-contain"
        />
      </div>
    </a>
  );
}
