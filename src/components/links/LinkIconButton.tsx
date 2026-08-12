/**
 * LinkIconButton Component
 * Reusable button with icon image for external links
 */

import React from 'react';
import { DERIVED_CONFIG } from '@/config/site';
import { Button } from '@/components/ui/button';

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
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-10 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:size-11 md:size-12"
    >
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={altText}
      >
        <img
          src={iconSource}
          alt={altText}
          className="block size-7 object-contain sm:size-8 md:size-9"
          loading="eager"
          decoding="async"
          onError={handleIconError}
        />
      </a>
    </Button>
  );
}
