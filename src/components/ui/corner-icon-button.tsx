import type { ComponentProps, ReactElement } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface CornerIconButtonProps extends Omit<ComponentProps<typeof Button>, "size" | "variant"> {
  edge: "top" | "bottom";
}

export function CornerIconButton({ edge, className, ...props }: CornerIconButtonProps): ReactElement {
  return (
    <Button
      {...props}
      variant="outline"
      size="responsive-icon"
      className={cn(
        // Match the social row: page inset + footer padding + footer border.
        "fixed right-[calc(1.25rem+1px)] z-40 border-border/80 bg-card/95 text-foreground shadow-lg backdrop-blur-sm hover:bg-accent",
        edge === "top" ? "top-[calc(1.25rem+1px)]" : "bottom-[calc(1.25rem+1px)]",
        className,
      )}
    />
  );
}
