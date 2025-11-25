/**
 * Profile Data
 * Core information about Justin Law
 */

import type { ProfileSection } from '@/types';

/**
 * Justin's professional profile
 */
export const JUSTIN_PROFILE: ProfileSection = {
  role: 'Senior Software Engineer at Defense Unicorns',
  company: 'Defense Unicorns - builds full-stack AI/ML applications and MLOps/GenAIOps platforms',
  background: 'Mechanical Engineer turned Software Engineer specializing in AI/ML',
  education:
    "Bachelor's in Mechanical Engineering from RIT with minors in Communications and Military Leadership. Graduate studies in Computer Science at Johns Hopkins and Georgia Tech focusing on Enterprise Web computing and AI",
  military:
    'US Air and Space Forces veteran, served as Captain (O3) and Developmental Engineer (62E), honorable discharge',
  skills: 'Full-stack development, AI/ML applications, MLOps, GenAIOps platforms',
  personality: 'Organized, personable, disciplined, hard-working, enthusiastic, diligent',
  interests: 'Running, cooking, video games, traveling, personal coding projects',
};

/**
 * Relevant terms for context validation
 */
export const RELEVANT_TERMS = [
  'justin',
  'defense unicorns',
  'engineer',
  'air force',
  'space force',
];

/**
 * Context priorities for query matching
 */
export const CONTEXT_PRIORITIES = [
  {
    section: 'role' as keyof ProfileSection,
    keywords: ['job', 'work', 'position', 'role', 'title'],
    weight: 2.0,
  },
  {
    section: 'company' as keyof ProfileSection,
    keywords: ['defense unicorns', 'company', 'employer', 'work'],
    weight: 2.0,
  },
  {
    section: 'education' as keyof ProfileSection,
    keywords: ['education', 'school', 'university', 'degree', 'study'],
    weight: 1.8,
  },
  {
    section: 'military' as keyof ProfileSection,
    keywords: ['military', 'air force', 'space force', 'veteran', 'captain'],
    weight: 1.8,
  },
  {
    section: 'skills' as keyof ProfileSection,
    keywords: ['skill', 'technology', 'programming', 'ai', 'ml'],
    weight: 1.5,
  },
  {
    section: 'background' as keyof ProfileSection,
    keywords: ['background', 'experience', 'career'],
    weight: 1.3,
  },
  {
    section: 'personality' as keyof ProfileSection,
    keywords: ['personality', 'character', 'person', 'like'],
    weight: 1.2,
  },
  {
    section: 'interests' as keyof ProfileSection,
    keywords: ['hobby', 'interest', 'free time', 'enjoy'],
    weight: 1.0,
  },
] as const;
