/**
 * LinkIconButton Component
 * Reusable button with icon image for external links
 */

import React from 'react';
import { DERIVED_CONFIG } from '@/config/site';

export interface LinkIconButtonProps {
  link: string;
  altText: string;
  filename: string;
}

function createIconSources(filename: string): string[] {
  const normalizedFilename = filename.replace(/^\/+/, '');
  const candidateSources = [
    `${DERIVED_CONFIG.basePath}/${normalizedFilename}`,
    `/${normalizedFilename}`,
    DERIVED_CONFIG.publicAssetsUrl.length > 0
      ? `${DERIVED_CONFIG.publicAssetsUrl}/${normalizedFilename}`
      : '',
  ];

  return candidateSources.filter(
    (source, index) => source.length > 0 && candidateSources.indexOf(source) === index,
  );
}

export function LinkIconButton({
  link,
  altText,
  filename,
}: LinkIconButtonProps): React.ReactElement {
  const iconSources = React.useMemo(() => createIconSources(filename), [filename]);
  const [iconSourceIndex, setIconSourceIndex] = React.useState(0);
  const iconSource = iconSources[Math.min(iconSourceIndex, iconSources.length - 1)];

  const handleIconError = React.useCallback((): void => {
    setIconSourceIndex((currentIndex) => {
      if (currentIndex >= iconSources.length - 1) {
        return currentIndex;
      }

      return currentIndex + 1;
    });
  }, [iconSources.length]);

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={altText}
    >
      <span className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded hover:bg-gray-800">
        <img
          src={iconSource}
          alt={altText}
          className="block w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain"
          loading="lazy"
          decoding="async"
          onError={handleIconError}
        />
      </span>
    </a>
  );
}
