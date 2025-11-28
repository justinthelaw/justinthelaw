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
 * AI Chatbot Configuration
 * Customize the chatbot behavior and messages
 */
export const CHATBOT_CONFIG = {
  // Welcome messages shown randomly when chat opens or resets
  welcomeMessages: [
    `Hello, I am ${SITE_CONFIG.name}'s AI assistant! Got any questions for me?`,
    `Hey there! Got any questions about ${SITE_CONFIG.name} for me?`,
    `Hi! Interested in learning more about ${SITE_CONFIG.name}?`,
    `What would you like to know about ${SITE_CONFIG.name}?`,
    `I heard you had questions about ${SITE_CONFIG.name}? Just ask away!`,
    `Thanks for visiting! Do you want to learn more about ${SITE_CONFIG.name}?`,
  ],

  // System prompt template for DUMBER model (generic, not fine-tuned)
  // Uses profile data to provide context about the person
  // The SMARTER model is fine-tuned on resume data and doesn't need this
  dumberSystemPrompt: `You are ${SITE_CONFIG.name}'s AI assistant. Answer questions about ${SITE_CONFIG.name} using only the provided context. Give informative but concise answers in 1-3 short sentences.`,
} as const;

/**
 * Profile Data for AI Chatbot Context
 * This data is used by the DUMBER model to answer questions
 * The SMARTER model is fine-tuned on resume data and uses this only for supplemental context
 */
export const PROFILE: ProfileSection = {
  role: "Senior Software Engineer at Defense Unicorns, builds full-stack AI/ML applications and platforms",
  company:
    "Defense Unicorns, delivers applications and platforms to critical operations using the Unicorn Delivery Service (UDS)",
  background:
    "Mechanical Engineer turned Software Engineer specializing in AI/ML applications and platforms",
  education:
    "Bachelor's in Mechanical Engineering from RIT with minors in Communications and Military Leadership. Graduate, master's level studies in Computer Science at Johns Hopkins University and Georgia Institute of Technology, focusing on enterprise web computing and AI/ML",
  military:
    "United States Air and Space Forces veteran, served as Captain (O3) and Developmental Engineer (62E), honorable discharge",
  skills:
    "Full-stack development, AI/ML applications, platforms engineering, Public Speaking, Leadership, Project Management",
  personality:
    "Organized, personable, disciplined, hard-working, enthusiastic, diligent",
  interests:
    "Running, cooking, video games, traveling, personal coding projects",
};
