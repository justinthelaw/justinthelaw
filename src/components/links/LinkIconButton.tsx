/**
 * LinkIconButton Component
 * Reusable button with icon image for external links
 */

import React from 'react';
import { DERIVED_CONFIG } from '@/config/site';
import { Button, responsiveIconStyles } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LinkIconButtonProps {
  link: string;
  altText: string;
  filename: string;
  tooltip: string;
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
  tooltip,
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
      size="responsive-icon"
      tooltip={tooltip}
      className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
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
          className={cn(responsiveIconStyles.icon, "block object-contain")}
          loading="eager"
          decoding="async"
          onError={handleIconError}
        />
      </a>
    </Button>
  );
}
