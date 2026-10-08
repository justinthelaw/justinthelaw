import { createCampaignContent as createContinuationContent } from './continuation-campaign.js';
import { createChapterWorkContent } from '../authored/chapter-work.js';
import { chapterWorkPolicies } from './chapter-work.js';
import { CHAPTER_WORK_REVISION } from '../../src/domain/state/chapter-work-revision.js';
import { steelSame } from './steel-progress.js';
/** Frozen v19 authenticates predecessors. Only this successor owns new work.
 * @param {import('./opening-campaign.js').CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createChapterWorkContent()) {
  if (!steelSame(authoredContent, createChapterWorkContent())) throw new TypeError('Unknown chapter-work authoring contract.');
  const prior = createContinuationContent(catalogs);
  const contentRevision = prior.contentRevision.replace('v19-turn-continuation-opening:browser-opening-v12-friends:', 'v20-chapter-work-opening:browser-opening-v20-chapter-work:');
  if (contentRevision !== CHAPTER_WORK_REVISION) throw new TypeError('Unknown chapter-work factual boundary.');
  return Object.freeze({ ...prior, contentRevision,
    policies: Object.freeze({ ...prior.policies, ...chapterWorkPolicies(prior.policies, catalogs, authoredContent) }),
  });
}
