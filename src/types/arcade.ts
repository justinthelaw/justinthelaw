export type BlobVariant = "blue" | "lavender" | "apricot";

export interface ArcadeGame {
  id: string;
  title: string;
  description: string;
  blobVariant: BlobVariant;
  preview?: {
    src: string;
    alt: string;
  };
  /** Static HTML entry point exported from the repository's games/ folder. */
  entryPoint?: `/games/${string}`;
}
