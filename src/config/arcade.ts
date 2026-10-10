import type { ArcadeGame } from "@/types";

export const ARCADE_GAMES: readonly ArcadeGame[] = [
  {
    id: "pokemon-dungeon-reimagined",
    title: "Pokémon Mystery Dungeon: Blue Rescue Team",
    description: "Become a Pokémon, meet your partner, and rescue Caterpie in Tiny Woods. A browser adaptation of the original DS opening, in development.",
    blobVariant: "blue",
    preview: {
      src: "/arcade/blue-rescue-team-preview.jpg",
      alt: "Art study of Pikachu and Charmander facing Groudon in Magma Cavern.",
    },
    entryPoint: "/games/pokemon-dungeon-reimagined/index.html",
  },
  {
    id: "game-two",
    title: "Coming soon",
    description: "A new game is on its way. Check back soon.",
    blobVariant: "lavender",
  },
  {
    id: "game-three",
    title: "Coming soon",
    description: "A new game is on its way. Check back soon.",
    blobVariant: "apricot",
  },
];
