import Link from "next/link";
import { DERIVED_CONFIG } from "@/config/site";
import { responsiveIconStyles } from "@/components/ui/button";
import { CornerIconButton } from "@/components/ui/corner-icon-button";

export function ArcadePortal(): React.ReactElement {
  return (
    <CornerIconButton
      asChild
      edge="top"
      tooltip={`Portal to ${DERIVED_CONFIG.possessiveName} arcade`}
      tooltipSide="left"
    >
      <Link href="/arcade/" aria-label={`Open ${DERIVED_CONFIG.possessiveName} arcade`}>
        <span
          data-testid="arcade-joystick"
          aria-hidden="true"
          className={`${responsiveIconStyles.icon} flex items-center justify-center text-[28px] leading-none sm:text-[32px] md:text-[36px]`}
        >
          🕹️
        </span>
      </Link>
    </CornerIconButton>
  );
}
