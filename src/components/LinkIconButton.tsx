import Image from "next/image";

interface LinkIconButton {
  link: string;
  altText: string;
  filename: string;
  path: string;
}

export default function LinkIconButton({
  link,
  altText,
  filename,
  path,
}: LinkIconButton) {
  return (
    <a href={`${link}`} target="_blank" rel="noopener noreferrer">
      <div className="flex items-center justify-center relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded hover:bg-gray-800">
        <div className="relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
          <Image
            src={`${path}/${filename}`}
            alt={altText}
            fill
            className="object-contain"
          />
        </div>
      </div>
    </a>
  );
}
