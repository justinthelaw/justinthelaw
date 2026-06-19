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
 * Public profile context sections for chatbot retrieval.
 */
export interface ProfileFact {
  id: string;
  text: string;
  keywords?: readonly string[];
}

export interface ProfileSection {
  id: string;
  title: string;
  facts: readonly ProfileFact[];
  keywords: readonly string[];
  priority: number;
  alwaysInclude?: boolean;
}

export const PROFILE_SECTIONS = [
  {
    id: "identity",
    title: "Identity",
    priority: 100,
    alwaysInclude: true,
    keywords: ["name", "identity", "location", "based", "who"],
    facts: [
      {
        id: "identity_location",
        text: "Justin Law is based in New York, USA.",
        keywords: ["justin", "law", "new york", "usa", "based"],
      },
    ],
  },
  {
    id: "current_role",
    title: "Current Role",
    priority: 90,
    keywords: [
      "current role",
      "current job",
      "current work",
      "employer",
      "role",
      "scope",
      "impact",
    ],
    facts: [
      {
        id: "current_role_title",
        text: "At OpenAI, Justin is an AI Deployment Engineer.",
        keywords: ["openai", "ai deployment engineer"],
      },
      {
        id: "current_role_scope",
        text:
          "Justin focuses on enterprise Codex adoption across CLI, SDK, MCP, " +
          "app-server, observability, Kubernetes, and full-stack workflows.",
        keywords: ["enterprise codex adoption", "cli", "sdk", "mcp"],
      },
      {
        id: "current_role_scale",
        text: "He has led engagements across 11 organizations and about 33,000 users.",
        keywords: ["11 organizations", "33000 users", "33,000 users"],
      },
    ],
  },
  {
    id: "experience",
    title: "Experience",
    priority: 80,
    keywords: [
      "experience",
      "previous role",
      "work history",
      "chronology",
      "before",
      "veteran",
      "career",
    ],
    facts: [
      {
        id: "experience_previous_role",
        text:
          "Previously, Justin was a Senior Software Engineer at Defense Unicorns, " +
          "working across 40+ Kubernetes, AI/ML, and full-stack repos.",
        keywords: ["senior software engineer", "defense unicorns", "40+"],
      },
      {
        id: "experience_veteran",
        text:
          "Justin is a U.S. Air Force and Space Force veteran and one of the " +
          "Space Force's first certified Supra Coders.",
        keywords: ["air force", "space force", "veteran", "supra coders"],
      },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    priority: 75,
    keywords: [
      "project",
      "projects",
      "built",
      "developed",
      "operator",
      "product",
      "tool",
      "rag",
      "metrics",
    ],
    facts: [
      {
        id: "projects_current_role",
        text:
          "He built Codex packages, OpenInference observability, and a Kubernetes " +
          "operator that diagnoses and remediates failing workloads.",
        keywords: ["codex packages", "openinference", "kubernetes operator"],
      },
      {
        id: "projects_products",
        text: "He developed LeapfrogAI and UDS AI.",
        keywords: ["leapfrogai", "uds ai"],
      },
      {
        id: "projects_rag_system",
        text: "He led a FIPS-compliant agentic RAG system for shipyard operations.",
        keywords: ["fips", "agentic rag", "shipyard"],
      },
      {
        id: "projects_metrics",
        text: "He improved model MRR 15% and agentic retrieval 38%.",
        keywords: ["mrr", "15%", "retrieval", "38%"],
      },
      {
        id: "projects_service",
        text:
          "He built RF deconfliction tools, orbital object OSINT apps, and " +
          "acquisition strategies.",
        keywords: ["rf deconfliction", "orbital object osint", "acquisition"],
      },
    ],
  },
  {
    id: "education",
    title: "Education",
    priority: 70,
    keywords: [
      "education",
      "degree",
      "mechanical engineering",
      "rit",
      "johns hopkins",
      "georgia tech",
      "graduate",
    ],
    facts: [
      {
        id: "education_rit",
        text: "Justin earned a B.S. in Mechanical Engineering from RIT.",
        keywords: ["mechanical engineering", "rit", "degree"],
      },
      {
        id: "education_graduate",
        text: "He completed graduate CS studies at Johns Hopkins and Georgia Tech.",
        keywords: ["graduate cs", "johns hopkins", "georgia tech"],
      },
    ],
  },
  {
    id: "recommendations",
    title: "Recommendations",
    priority: 65,
    keywords: [
      "recommendation",
      "recommendations",
      "personable",
      "collaborative",
      "pressure",
      "problem solver",
    ],
    facts: [
      {
        id: "recommendations_summary",
        text:
          "Recommendations describe him as personable, collaborative, calm under " +
          "pressure, technically deep, and a strong problem solver.",
        keywords: ["personable", "collaborative", "calm under pressure"],
      },
    ],
  },
  {
    id: "skills",
    title: "Skills",
    priority: 60,
    keywords: [
      "skills",
      "leadership",
      "public speaking",
      "technical writing",
      "systems design",
      "ai",
      "ml",
      "kubernetes",
      "rag",
      "observability",
      "mlflow",
    ],
    facts: [
      {
        id: "skills_strengths",
        text:
          "Strengths include leadership, public speaking, technical writing, pair " +
          "programming, systems design, AI/ML, Kubernetes, secure deployment, RAG, " +
          "observability, MLFlow, inference engines, and mission-critical delivery.",
        keywords: ["systems design", "ai/ml", "kubernetes", "rag", "mlflow"],
      },
    ],
  },
  {
    id: "interests",
    title: "Interests",
    priority: 40,
    keywords: ["interests", "hobbies", "outside work", "personal interests"],
    facts: [
      {
        id: "interests_personal",
        text: "Justin enjoys videogames, hiking, running, and cooking.",
        keywords: ["videogames", "hiking", "running", "cooking", "hobbies"],
      },
    ],
  },
] as const satisfies readonly ProfileSection[];

/**
 * Personal knowledge for the chatbot.
 *
 * This compatibility text is derived from structured public profile sections.
 */
export const PERSONAL_CONTEXT = PROFILE_SECTIONS.map(
  (section) =>
    `${section.title}: ${section.facts.map((fact) => fact.text).join(" ")}`
).join("\n\n");
