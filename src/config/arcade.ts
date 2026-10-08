import type { ArcadeGame } from "@/types";

export const ARCADE_GAMES: readonly ArcadeGame[] = [
  {
    id: "pokemon-dungeon-reimagined",
    title: "Pokemon Mystery Dungeon Blue Rescue Team - Reimagined",
    description: "Blue Rescue Team's opening adventure through Mt. Steel and escort jobs, in development. Later chapters remain unfinished.",
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
