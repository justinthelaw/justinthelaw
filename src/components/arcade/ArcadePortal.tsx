import Link from "next/link";
import { DERIVED_CONFIG } from "@/config/site";
import { responsiveIconStyles } from "@/components/ui/button";
import { CornerIconButton } from "@/components/ui/corner-icon-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PixelBlob } from "./PixelBlob";

export function ArcadePortal(): React.ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <CornerIconButton
          asChild
          edge="top"
        >
          <Link href="/arcade/" aria-label={`Open ${DERIVED_CONFIG.possessiveName} arcade`}>
            <PixelBlob variant="blue" className={responsiveIconStyles.icon} decorative />
          </Link>
        </CornerIconButton>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={8}>
        Portal to {DERIVED_CONFIG.possessiveName} arcade
      </TooltipContent>
    </Tooltip>
  );
}
