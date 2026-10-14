import type { ArcadeGame } from "@/types";

export const ARCADE_GAMES: readonly ArcadeGame[] = [
  {
    id: "pokemon-dungeon-reimagined",
    title: "Pokémon Mystery Dungeon: Roux's Adventure",
    description: "Play as Roux or another Pokémon, choose your partner, and rescue Caterpie in Tiny Woods. A playful adventure with a chocolate-and-cream theme.",
    blobVariant: "blue",
    preview: {
      src: "/arcade/blue-rescue-team-preview.png",
      alt: "Roux exploring Tiny Woods with Torchic as his companion.",
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
