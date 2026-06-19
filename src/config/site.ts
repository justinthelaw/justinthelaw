/**
 * Site Configuration
 * Centralized configuration for customizing the personal website
 *
 * This file contains all the customizable values for the website.
 * To customize this site for yourself, update the values in this file.
 * See docs/CUSTOMIZATION.md for detailed instructions.
 */

/**
 * Personal Information
 */
export const SITE_CONFIG = {
  // Basic Information
  name: "Justin",
  fullName: "Justin Law",
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
  resumeFileId: "1oFI8htHE1E4CmQvlcmJWY7jsznqt90Pi",
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
      "Justin Law's personal website showcasing AI deployment, secure software engineering, and AI-powered chat",
  },
} as const;

/**
 * Derived Configuration
 * These values are computed from SITE_CONFIG and should not be modified directly
 */
export const DERIVED_CONFIG = {
  // Canonical GitHub Pages base path (independent of NODE_ENV)
  get githubPagesBasePath() {
    const isUserOrOrgSiteRepo =
      SITE_CONFIG.repository.name === `${SITE_CONFIG.repository.owner}.github.io`;
    return isUserOrOrgSiteRepo ? "" : `/${SITE_CONFIG.repository.name}`;
  },
  // GitHub Pages deployment URLs
  get basePath() {
    return process.env.NODE_ENV === "production" ? this.githubPagesBasePath : "";
  },
  get assetPrefix() {
    if (process.env.NODE_ENV !== "production") {
      return "";
    }
    return this.githubPagesBasePath.length > 0 ? `${this.githubPagesBasePath}/` : "";
  },
  // Full GitHub Pages URL
  get siteUrl() {
    return `https://${SITE_CONFIG.repository.owner}.github.io${this.githubPagesBasePath}/`;
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
 * Personal knowledge for the chatbot.
 *
 * Paste resume text, cover letter text, biography notes, project summaries,
 * recommendations, or any other public context here. The chatbot receives this
 * block as its source of truth and trims from the tail when it exceeds the
 * browser model's prompt budget.
 */
export const PERSONAL_CONTEXT = `
Justin Law is based in New York, USA. At OpenAI, he is an AI Deployment Engineer
focused on enterprise Codex adoption across CLI, SDK, MCP, app-server,
observability, Kubernetes, and full-stack workflows. He enjoys videogames,
hiking, running, and cooking.

At OpenAI, Justin has led engagements across 11 organizations and about 33,000
users, and built Codex packages, OpenInference observability, and a Kubernetes
operator that diagnoses and remediates failing workloads.

Previously, Justin was a Senior Software Engineer at Defense Unicorns, working
across 40+ Kubernetes, AI/ML, and full-stack repos. He developed LeapfrogAI and
UDS AI; led a FIPS-compliant agentic RAG system for shipyard operations;
improved model MRR 15% and agentic retrieval 38%; and deployed hardened AI/ML
platforms in secure environments.

Justin is a U.S. Air Force and Space Force veteran and one of the Space Force's
first certified Supra Coders. He built RF deconfliction tools, orbital object
OSINT apps, and acquisition strategies.

Justin earned a B.S. in Mechanical Engineering from RIT and completed graduate
CS studies at Johns Hopkins and Georgia Tech.

Strengths include leadership, public speaking, technical writing, pair
programming, systems design, AI/ML, Kubernetes, secure deployment, RAG,
observability, MLFlow, inference engines, and mission-critical delivery.
Recommendations describe him as personable, collaborative, calm under pressure,
technically deep, and a strong problem solver.
`.trim();
