/**
 * LinkIconButton Component
 * Reusable button with icon image for external links
 */

import React from 'react';
import Image from 'next/image';
import { DERIVED_CONFIG } from '@/config/site';

export interface LinkIconButtonProps {
  link: string;
  altText: string;
  filename: string;
}

export function LinkIconButton({
  link,
  altText,
  filename,
}: LinkIconButtonProps): React.ReactElement {
  const iconSource = `${DERIVED_CONFIG.basePath}/${filename}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={altText}
    >
      <span className="flex items-center justify-center relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded hover:bg-gray-800">
        <span className="relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
          <Image src={iconSource} alt={altText} fill className="object-contain" />
        </span>
      </span>
    </a>
  );
}
