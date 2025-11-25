/**
 * Site Configuration
 * Centralized configuration for customizing the personal website
 *
 * This file contains all the customizable values for the website.
 * To customize this site for yourself, update the values in this file.
 * See docs/CUSTOMIZATION.md for detailed instructions.
 */

import type { ProfileSection } from "@/types";

/**
 * Personal Information
 */
export const SITE_CONFIG = {
  // Basic Information
  name: "Justin Law",
  githubUsername: "justinthelaw",

  // Repository Configuration (for GitHub Pages deployment)
  // Update these if you rename your repository or change ownership
  repository: {
    owner: "justinthelaw",
    name: "justinthelaw", // Repository name (also used for GitHub Pages basePath)
    defaultBranch: "main",
  },

  // Copyright Information
  copyright: {
    year: "2025",
    holder: "Justin Law",
  },

  // Resume Configuration
  // For Google Drive: Use the file ID from the shareable link
  // Example: https://drive.google.com/file/d/[FILE_ID]/view
  resumeFileId: "1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp",
  resumeProvider: "google-drive" as const, // or "direct-url" for custom hosting

  // Social Links
  // Set to empty string to hide a link
  socialLinks: {
    github: "https://github.com/justinthelaw",
    linkedin: "https://www.linkedin.com/in/justinwingchunglaw",
    huggingface: "https://huggingface.co/justinthelaw",
    gitlab: "https://repo1.dso.mil/justinthelaw",
    // Add more links as needed - will require icon files in public/
  },

  // SEO & Meta
  seo: {
    title: "Justin Law",
    description:
      "Justin Law's personal website showcasing experience and AI-powered chat",
  },
} as const;

/**
 * Derived Configuration
 * These values are computed from SITE_CONFIG and should not be modified directly
 */
export const DERIVED_CONFIG = {
  // GitHub Pages deployment URLs
  get basePath() {
    return process.env.NODE_ENV === "production"
      ? `/${SITE_CONFIG.repository.name}.github.io`
      : "";
  },
  get assetPrefix() {
    return process.env.NODE_ENV === "production"
      ? `/${SITE_CONFIG.repository.name}.github.io/`
      : "";
  },
  // GitHub raw content URL for production
  get publicAssetsUrl() {
    return process.env.NODE_ENV === "production"
      ? `https://raw.githubusercontent.com/${SITE_CONFIG.repository.owner}/${SITE_CONFIG.repository.name}/refs/heads/${SITE_CONFIG.repository.defaultBranch}/public`
      : "";
  },
  // Full GitHub Pages URL
  get siteUrl() {
    return `https://${SITE_CONFIG.repository.owner}.github.io/${SITE_CONFIG.repository.name}/`;
  },
  // Repository URL
  get repositoryUrl() {
    return `https://github.com/${SITE_CONFIG.repository.owner}/${SITE_CONFIG.repository.name}`;
  },
  // Possessive helper for names ending with "s"
  get possessiveName() {
    const trimmedName = SITE_CONFIG.name.trim();
    if (!trimmedName) {
      return "";
    }
    return trimmedName.endsWith("s") ? `${trimmedName}'` : `${trimmedName}'s`;
  },
} as const;

/**
 * Profile Data for AI Chatbot Context
 */
export const PROFILE: ProfileSection = {
  role: "Senior Software Engineer at Defense Unicorns",
  company:
    "Defense Unicorns - builds full-stack AI/ML applications and AI/ML platforms",
  background:
    "Mechanical Engineer turned Software Engineer specializing in AI/ML",
  education:
    "Bachelor's in Mechanical Engineering from RIT with minors in Communications and Military Leadership. Graduate studies in Computer Science at Johns Hopkins and Georgia Tech focusing on Enterprise Web computing and AI",
  military:
    "US Air and Space Forces veteran, served as Captain (O3) and Developmental Engineer (62E), honorable discharge",
  skills:
    "Full-stack development, AI/ML applications, MLOps platforms, Public Speaking, Leadership, Project Management",
  personality:
    "Organized, personable, disciplined, hard-working, enthusiastic, diligent",
  interests:
    "Running, cooking, video games, traveling, personal coding projects",
};

/**
 * Relevant terms for context validation
 * Update these to match your profile information
 */
export const RELEVANT_TERMS = [
  "justin",
  "defense unicorns",
  "engineer",
  "air force",
  "space force",
];

/**
 * Context priorities for query matching
 * Adjust weights to prioritize different sections of your profile
 */
export const CONTEXT_PRIORITIES = [
  {
    section: "role" as keyof ProfileSection,
    keywords: ["job", "work", "position", "role", "title"],
    weight: 2.0,
  },
  {
    section: "company" as keyof ProfileSection,
    keywords: ["defense unicorns", "company", "employer", "work"],
    weight: 2.0,
  },
  {
    section: "education" as keyof ProfileSection,
    keywords: ["education", "school", "university", "degree", "study"],
    weight: 1.8,
  },
  {
    section: "military" as keyof ProfileSection,
    keywords: ["military", "air force", "space force", "veteran", "captain"],
    weight: 1.8,
  },
  {
    section: "skills" as keyof ProfileSection,
    keywords: ["skill", "technology", "programming", "ai", "ml"],
    weight: 1.5,
  },
  {
    section: "background" as keyof ProfileSection,
    keywords: ["background", "experience", "career"],
    weight: 1.3,
  },
  {
    section: "personality" as keyof ProfileSection,
    keywords: ["personality", "character", "person", "like"],
    weight: 1.2,
  },
  {
    section: "interests" as keyof ProfileSection,
    keywords: ["hobby", "interest", "free time", "enjoy"],
    weight: 1.0,
  },
] as const;
