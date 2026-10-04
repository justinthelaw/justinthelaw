import { useRef, useState } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { DERIVED_CONFIG } from "@/config/site";
import type { ArcadeGame } from "@/types";
import { Button } from "@/components/ui/button";
import { ArcadeCard } from "./ArcadeCard";
import styles from "./Arcade.module.css";

interface ArcadeGamesProps {
  games: readonly ArcadeGame[];
}

export function ArcadeGames({ games }: ArcadeGamesProps): React.ReactElement {
  const [activeGame, setActiveGame] = useState<ArcadeGame | null>(null);
  const gameFrameRef = useRef<HTMLIFrameElement>(null);

  function playGame(game: ArcadeGame): void {
    if (game.entryPoint) setActiveGame(game);
  }

  function closeGame(): void {
    const gameId = activeGame?.id;
    setActiveGame(null);
    // Cards remount; restore focus to the new copy of the Play button.
    window.requestAnimationFrame(() => {
      if (gameId) document.getElementById(`play-${gameId}`)?.focus();
    });
  }

  if (activeGame?.entryPoint) {
    return (
      <section aria-label={`${activeGame.title} game`} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="lg" className="min-h-11" onClick={closeGame} tooltip="Back to games">
            <ArrowLeftIcon aria-hidden="true" />Back to games
          </Button>
          <h2 className="font-heading text-xl font-medium">{activeGame.title}</h2>
        </div>
        <iframe
          ref={gameFrameRef}
          src={`${DERIVED_CONFIG.basePath}${activeGame.entryPoint}`}
          title={`${activeGame.title} game`}
          className={styles.gameFrame}
          allow="autoplay; fullscreen"
          allowFullScreen
          onLoad={() => gameFrameRef.current?.focus()}
        />
      </section>
    );
  }

  return (
    <section aria-label="Arcade games" className="mx-auto flex w-full max-w-[620px] min-w-0 flex-col gap-6">
      {games.map((game) => <ArcadeCard key={game.id} game={game} onPlay={playGame} />)}
    </section>
  );
}
