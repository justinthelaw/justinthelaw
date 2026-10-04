import Link from "next/link";
import { DERIVED_CONFIG } from "@/config/site";
import { responsiveIconStyles } from "@/components/ui/button";
import { CornerIconButton } from "@/components/ui/corner-icon-button";
import { PixelBlob } from "./PixelBlob";

export function ArcadePortal(): React.ReactElement {
  return (
    <CornerIconButton
      asChild
      edge="top"
      tooltip={`Portal to ${DERIVED_CONFIG.possessiveName} arcade`}
      tooltipSide="left"
    >
      <Link href="/arcade/" aria-label={`Open ${DERIVED_CONFIG.possessiveName} arcade`}>
        <PixelBlob variant="blue" className={responsiveIconStyles.icon} decorative />
      </Link>
    </CornerIconButton>
  );
}
