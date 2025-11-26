/**
 * GitHubProfile Component
 * Displays GitHub bio fetched from GitHub API
 */

import React, { useEffect, useState } from 'react';
import { fetchGitHubBio } from '@/services/github';
import { SITE_CONFIG } from '@/config/site';

export function GitHubProfile(): React.ReactElement {
  const [bio, setBio] = useState('');

  useEffect(() => {
    const loadBio = async () => {
      const fetchedBio = await fetchGitHubBio(SITE_CONFIG.githubUsername);
      setBio(fetchedBio);
    };

    loadBio();
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
