/**
 * GitHub API Service
 * Handles GitHub API calls for user profile information
 */

import { SITE_CONFIG } from "@/config/site";
import { createLogger, LOG_AREAS } from "@/utils";

const GITHUB_API_BASE = "https://api.github.com";
const logger = createLogger(LOG_AREAS.GITHUB_SERVICE);

export interface GitHubUser {
  bio: string | null;
  name: string | null;
  login: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

/**
 * Fetch a GitHub user's profile information
 */
export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  const response = await fetch(`${GITHUB_API_BASE}/users/${username}`);

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return data as GitHubUser;
}

/**
 * Fetch a GitHub user's bio with fallback handling
 */
export async function fetchGitHubBio(
  username: string,
  fallbackMessage: string = SITE_CONFIG.githubBioFallback
): Promise<string> {
  try {
    const user = await fetchGitHubUser(username);
    return user.bio || fallbackMessage;
  } catch (error) {
    logger.warn(`failed to fetch bio for ${username}:`, error);
    return fallbackMessage;
  }
}
