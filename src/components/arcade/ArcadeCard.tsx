import Image from "next/image";
import { PlayIcon } from "lucide-react";
import { DERIVED_CONFIG } from "@/config/site";
import type { ArcadeGame } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { PixelBlob } from "./PixelBlob";
import styles from "./Arcade.module.css";

interface ArcadeCardProps {
  game: ArcadeGame;
  onPlay: (game: ArcadeGame) => void;
}

export function ArcadeCard({ game, onPlay }: ArcadeCardProps): React.ReactElement {
  const headingId = `arcade-${game.id}`;
  const previewSrc = game.preview?.src.startsWith("/")
    ? `${DERIVED_CONFIG.basePath}${game.preview.src}`
    : game.preview?.src;

  return (
    <article aria-labelledby={headingId} className="min-w-0">
      <Card className="gap-0 border border-border/70 bg-card/70 py-0 shadow-sm ring-0">
        <div className={`${styles.preview} ${styles[game.blobVariant]}`}>
          {game.preview && previewSrc ? (
            <Image src={previewSrc} alt={game.preview.alt} width={640} height={360} className="max-h-full w-auto max-w-full object-contain" unoptimized />
          ) : (
            <PixelBlob variant={game.blobVariant} />
          )}
        </div>
        <CardContent className="p-5">
          <h2 id={headingId} className="font-heading text-lg font-medium tracking-tight">{game.title}</h2>
          <CardDescription className="mt-2 leading-relaxed">{game.description}</CardDescription>
          <div className="mt-5 flex justify-end">
            <Button
              id={`play-${game.id}`}
              variant="outline"
              size="lg"
              className="min-h-11 min-w-24"
              disabled={!game.entryPoint}
              tooltip={game.entryPoint ? "Play game" : "Coming soon"}
              aria-label={game.entryPoint ? `Play ${game.title}` : "Play, coming soon"}
              onClick={() => onPlay(game)}
            >
              <PlayIcon aria-hidden="true" />Play
            </Button>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
