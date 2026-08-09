/**
 * GitHubProfile Component
 * Displays GitHub bio fetched from GitHub API
 */

import React, { useEffect, useState } from 'react';
import { fetchGitHubBio } from '@/services/github';
import { SITE_CONFIG } from '@/config/site';

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
    <p
      className="text-center text-sm sm:text-sm md:text-base lg:text-base mx-4"
      data-testid="github-bio"
    >
      {bio}
    </p>
  );
}
