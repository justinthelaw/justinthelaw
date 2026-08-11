/**
 * GitHubProfile Component
 * Displays GitHub bio fetched from GitHub API
 */

import React, { useEffect, useState } from 'react';
import { fetchGitHubBio } from '@/services/github';
import { SITE_CONFIG } from '@/config/site';
import { CardDescription } from '@/components/ui/card';

export function GitHubProfile(): React.ReactElement {
  const [bio, setBio] = useState<string>(SITE_CONFIG.githubBioFallback);

  useEffect(() => {
    let isCurrent = true;

    const loadBio = async (): Promise<void> => {
      const fetchedBio = await fetchGitHubBio(SITE_CONFIG.githubUsername);
      if (isCurrent) {
        setBio(fetchedBio);
      }
    };

    void loadBio();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <CardDescription
      className="mx-4 text-center text-sm text-muted-foreground md:text-base"
      data-testid="github-bio"
    >
      {bio}
    </CardDescription>
  );
}
