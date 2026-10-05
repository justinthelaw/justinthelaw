import { useRef } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { DERIVED_CONFIG } from "@/config/site";
import type { ArcadeGame } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { GameControls } from "./GameControls";
import styles from "./Arcade.module.css";

interface GamePlayerProps {
  game: ArcadeGame | null;
  onClose: () => void;
}

export function GamePlayer({ game, onClose }: GamePlayerProps): React.ReactElement {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  function focusGame(): void {
    const iframe = iframeRef.current;
    iframe?.focus();
    // Local games share the website origin, so native keys reach their window.
    iframe?.contentWindow?.focus();
  }

  return (
    <Dialog open={Boolean(game?.entryPoint)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className={styles.gamePlayer}
        showCloseButton={false}
        data-testid="game-player"
        onOpenAutoFocus={() => {
          triggerRef.current = game ? document.getElementById(`play-${game.id}`) : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        {game?.entryPoint && (
          <>
            <header className={styles.gameToolbar}>
              <Button variant="outline" size="lg" className="min-h-11" onClick={onClose} tooltip="Back to games">
                <ArrowLeftIcon aria-hidden="true" />Back to games
              </Button>
              <DialogTitle className={styles.gameTitle}>{game.title}</DialogTitle>
              <DialogDescription className="sr-only">{game.description}</DialogDescription>
            </header>
            <div className={styles.gameViewport}>
              <iframe
                ref={iframeRef}
                src={`${DERIVED_CONFIG.basePath}${game.entryPoint}`}
                title={`${game.title} game`}
                className={styles.gameFrame}
                data-testid="game-iframe"
                allow="autoplay; fullscreen"
                allowFullScreen
                onLoad={focusGame}
              />
              <GameControls iframeRef={iframeRef} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
