/** Original English scene adaptation, retaining the opening's event order.
 * Source-qualified story beats: content/onboarding/initialization.json and
 * Nintendo's Blue Rescue Team manual. Commercial dialogue is not reproduced.
 */
/** @typedef {'narrator'|'hero'|'partner'|'butterfree'|'caterpie'} Speaker */
/** @typedef {{speaker:Speaker,text:string,scene?:string,pose?:string}} StoryLine */

/** @type {Readonly<Record<string,readonly StoryLine[]>>} */
export const STORY = Object.freeze({
  welcome: [
    { speaker: 'narrator', text: 'Welcome to the world of Pokémon!' },
    { speaker: 'narrator', text: 'A new adventure is waiting for you. First, let us discover which Pokémon you will become.' },
    { speaker: 'narrator', text: 'Please answer each question honestly. Think about what you would do.' },
    { speaker: 'narrator', text: 'Are you ready? Let us begin.' },
  ],
  departure: [
    { speaker: 'narrator', text: '{partner} will be your partner on this adventure.' },
    { speaker: 'narrator', text: 'A world of Pokémon, mysterious dungeons, and new friends awaits you.' },
    { speaker: 'narrator', text: 'Now, take your first step into that world...' },
  ],
  awakening: [
    { speaker: 'hero', text: 'Where am I? Everything feels strange...', scene: 'dream' },
    { speaker: 'hero', text: 'I can hear someone calling to me.', scene: 'dream' },
    { speaker: 'partner', text: 'Hey! Can you hear me? Please wake up!' },
    { speaker: 'partner', text: 'You are awake! What a relief. I found you lying here.' },
    { speaker: 'partner', text: 'I have never seen you around here before. Where did you come from?' },
    { speaker: 'hero', text: 'I was a human... But these paws... This body...!' },
    { speaker: 'partner', text: 'A human? But you look just like a {species}!', pose: 'surprise' },
    { speaker: 'hero', text: 'I really have turned into a Pokémon! How could this happen?', pose: 'surprise' },
    { speaker: 'partner', text: 'That is an unusual story. Well, what is your name?' },
  ],
  named: [
    { speaker: 'partner', text: '{hero}? That is a nice name. I am {partner}.' },
    { speaker: 'hero', text: 'I cannot remember anything else. Why am I here?' },
    { speaker: 'butterfree', text: 'Help! Somebody, please help!' },
    { speaker: 'partner', text: 'What happened? Tell us what is wrong.' },
  ],
  trouble: [
    { speaker: 'butterfree', text: 'My little Caterpie fell into a fissure! He cannot climb out!' },
    { speaker: 'butterfree', text: 'The ground suddenly split beneath him. I tried to reach him, but the Pokémon in the woods attacked me.' },
    { speaker: 'partner', text: 'They attacked you? Pokémon would not normally do that.' },
    { speaker: 'butterfree', text: 'They seem frightened and angry. I cannot get past them... My poor child is all alone!' },
    { speaker: 'partner', text: 'The natural disasters must have upset them. We cannot leave Caterpie down there.' },
    { speaker: 'partner', text: '{hero}, will you come with me? We have to help!' },
  ],
  enter: [
    { speaker: 'partner', text: 'Thank you! Stay close, {hero}. We will find Caterpie together.' },
    { speaker: 'butterfree', text: 'Please bring my child back safely!' },
  ],
  clearing: [
    { speaker: 'caterpie', text: 'Mommy... Where are you? I want to go home...' },
    { speaker: 'partner', text: 'There he is! Caterpie, are you hurt?' },
    { speaker: 'caterpie', text: 'Who are you? Did my mommy send you?' },
    { speaker: 'partner', text: 'She is waiting for you. We came to take you back to her.' },
    { speaker: 'caterpie', text: 'Really? Thank you! I was so scared.' },
    { speaker: 'partner', text: 'You are safe now. Let us get out of here.' },
  ],
  reunion: [
    { speaker: 'butterfree', text: 'Caterpie! My darling! You are safe!' },
    { speaker: 'caterpie', text: 'Mommy! They came and found me!' },
    { speaker: 'butterfree', text: 'Thank you both so much. I was beside myself with worry.' },
    { speaker: 'partner', text: 'We are just glad that Caterpie is all right.' },
    { speaker: 'butterfree', text: 'These berries are a small way to thank you. Please take them.' },
    { speaker: 'narrator', text: 'You received an Oran Berry, a Pecha Berry, and a Rawst Berry.' },
    { speaker: 'caterpie', text: 'Thank you for rescuing me! You were really brave!' },
    { speaker: 'hero', text: 'Helping someone feels good. Perhaps being a Pokémon will not be so bad after all.' },
    { speaker: 'butterfree', text: 'Come along, Caterpie. Let us go home.' },
    { speaker: 'partner', text: 'We did it, {hero}! Our first rescue was a success.' },
  ],
});

/** @param {string} text @param {{heroName:string,partnerName:string,heroSpeciesName:string}} names */
export function interpolateStory(text, names) {
  return text.replaceAll('{hero}', names.heroName).replaceAll('{partner}', names.partnerName)
    .replaceAll('{species}', names.heroSpeciesName);
}

/** @type {Readonly<Record<number,string[]>>} */
export const FLOOR_TUTORIALS = Object.freeze({
  1: [
    'Move with the directional controls. Other Pokémon act after you do. Take your time and choose your next step.',
    'Face an enemy and press A to attack. Open the menu to use a move. Moves use PP and help you earn more experience.',
    'Find the stairs to reach the next floor. Hold B while moving to travel quickly when the way is clear.',
  ],
  2: [
    'Walking restores HP little by little, but your Belly slowly empties. Keep an eye on both.',
    'A Pokémon can hold one item. Pick up a berry by walking onto it, then choose Held Item from the menu to eat it.',
  ],
  3: [
    'We must be getting close to Caterpie. Stay together and look for the stairs!',
  ],
});
