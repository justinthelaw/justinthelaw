/**
 * Site Configuration
 * Centralized configuration for customizing the personal website
 *
 * See docs/CUSTOMIZATION.md for detailed instructions.
 */

import publicProfileSections from "./public-profile.json" with { type: "json" };

/**
 * Personal Information
 */
export const SITE_CONFIG = {
  // Basic Information
  name: "Justin",
  fullName: "Justin Law",
  githubUsername: "justinthelaw",
  githubBioFallback:
    "AI Deployment Engineer focused on secure software engineering and AI-powered developer tools.",

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
  resumeProvider: "google-drive" as const,

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
    imageUrl: "https://avatars.githubusercontent.com/u/81255462?v=4",
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
    return this.githubPagesBasePath.length > 0
      ? `${this.githubPagesBasePath}/`
      : "";
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
 * Public profile context sections for chatbot retrieval and ML evaluation.
 */
export interface ProfileFact {
  id: string;
  text: string;
  keywords: readonly string[];
  terms: readonly string[];
  termGroups?: Readonly<Partial<Record<string, readonly string[]>>>;
}

export interface ProfileSubject {
  name: string;
  shortName: string;
  subjectPronoun: string;
  objectPronoun: string;
  possessivePronoun: string;
}

export interface ProfileSection {
  id: string;
  title: string;
  facts: readonly ProfileFact[];
  keywords: readonly string[];
  priority: number;
  alwaysInclude?: boolean;
  subject?: ProfileSubject;
}

/**
 * Browser profile data loaded from the shared canonical source.
 */
export const PROFILE_SECTIONS: readonly ProfileSection[] =
  publicProfileSections;

function getCanonicalProfileSubject(
  sections: readonly ProfileSection[]
): ProfileSubject {
  const subject = sections.find((section) => section.id === "identity")?.subject;
  if (!subject || typeof subject !== "object" || Array.isArray(subject)) {
    throw new Error(
      "src/config/public-profile.json requires identity.subject metadata"
    );
  }

  const requireSubjectText = (field: keyof ProfileSubject): string => {
    const value = subject[field];
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(
        `src/config/public-profile.json requires a non-empty identity.subject.${field}`
      );
    }
    return value.trim();
  };

  return {
    name: requireSubjectText("name"),
    shortName: requireSubjectText("shortName"),
    subjectPronoun: requireSubjectText("subjectPronoun"),
    objectPronoun: requireSubjectText("objectPronoun"),
    possessivePronoun: requireSubjectText("possessivePronoun"),
  };
}

/**
 * Canonical identity used by both browser prompts and Profile-QA training.
 */
export const PROFILE_SUBJECT: ProfileSubject =
  getCanonicalProfileSubject(PROFILE_SECTIONS);

/**
 * Personal knowledge for the chatbot.
 *
 * This compatibility text is derived from structured public profile sections.
 */
export const PERSONAL_CONTEXT = PROFILE_SECTIONS.map(
  (section) =>
    `${section.title}: ${section.facts.map((fact) => fact.text).join(" ")}`
).join("\n\n");
