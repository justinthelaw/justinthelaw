/**
 * GitHub API Service
 * Handles GitHub API calls for user profile information
 */

import { SITE_CONFIG } from "@/config/site";

const GITHUB_API_BASE = "https://api.github.com";
const PERSON_NAME = SITE_CONFIG.fullName || "this person";
const DEFAULT_BIO_FALLBACK = `Oops! It seems like GitHub's API might be down so the website can't grab ${PERSON_NAME}'s GitHub bio. Anyway, let's just assume that ${PERSON_NAME} is really cool!`;

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
  fallbackMessage: string = DEFAULT_BIO_FALLBACK
): Promise<string> {
  try {
    const user = await fetchGitHubUser(username);
    return user.bio || fallbackMessage;
  } catch (error) {
    console.warn(`Error fetching GitHub bio for ${username}:`, error);
    return fallbackMessage;
  }
}
