import { createFriendsContent, FRIENDS } from './friends.js';
/** Newly written inside-base wakeup only. The outside mailbox scene remains
 * inactive until its separate op3b06 posting transaction is implemented.
 * @returns {import('./opening.js').AuthoredOpening} */
export function createChapterWorkContent() {
  const prior = createFriendsContent();
  return { ...prior, revision: 'browser-opening-v20-chapter-work', scenes: prior.scenes.map(scene => scene.id !== FRIENDS.scenes[5] ? scene : { ...scene,
    lines: ['Morning light reaches your room. After another day of rescue work, you wake at home.', 'You rise, ready to meet your partner outside. The rescue requests you accepted are still waiting for your team.'],
  }) };
}
