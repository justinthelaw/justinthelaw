import { useState } from "react";
import type { ArcadeGame } from "@/types";
import { ArcadeCard } from "./ArcadeCard";
import { GamePlayer } from "./GamePlayer";

interface ArcadeGamesProps {
  games: readonly ArcadeGame[];
}

export function ArcadeGames({ games }: ArcadeGamesProps): React.ReactElement {
  const [activeGame, setActiveGame] = useState<ArcadeGame | null>(null);

  function playGame(game: ArcadeGame): void {
    if (game.entryPoint) setActiveGame(game);
  }

  function closeGame(): void {
    setActiveGame(null);
  }

  return (
    <>
      <section aria-label="Arcade games" className="mx-auto flex w-full max-w-[620px] min-w-0 flex-col gap-6">
        {games.map((game) => <ArcadeCard key={game.id} game={game} onPlay={playGame} />)}
      </section>
      <GamePlayer game={activeGame} onClose={closeGame} />
    </>
  );
}
