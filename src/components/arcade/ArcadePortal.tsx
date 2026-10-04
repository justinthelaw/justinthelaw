import Link from "next/link";
import { DERIVED_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PixelBlob } from "./PixelBlob";

export function ArcadePortal(): React.ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant="outline"
          size="icon"
          className="fixed right-4 top-4 z-40 size-12 border-border/80 bg-card/95 p-1 shadow-lg backdrop-blur-sm hover:bg-accent"
        >
          <Link href="/arcade/" aria-label={`Open ${DERIVED_CONFIG.possessiveName} arcade`}>
            <PixelBlob variant="blue" className="size-9" decorative />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={8}>
        Portal to {DERIVED_CONFIG.possessiveName} arcade
      </TooltipContent>
    </Tooltip>
  );
}
