/**
 * ResumeViewer Component
 * Displays PDF resume from Google Drive with fallback handling
 */

"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { SITE_CONFIG } from "@/config/site";
import { createLogger, LOG_AREAS } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PDF_PREVIEW_URL = `https://drive.google.com/file/d/${SITE_CONFIG.resumeFileId}/preview`;
const PDF_OPEN_URL = `https://drive.google.com/file/d/${SITE_CONFIG.resumeFileId}/view?usp=sharing`;
const LOADING_TIMEOUT_MS = 15000; // Increased to 15s
const MAX_RETRIES = 2;
const logger = createLogger(LOG_AREAS.RESUME);

function GoogleDriveIcon(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path d="M8.6 2h6.8l6.8 11.8h-6.8L8.6 2Z" fill="#0F9D58" />
      <path d="m8.6 2 3.4 5.9-6.8 11.8-3.4-5.9L8.6 2Z" fill="#F4B400" />
      <path d="m5.2 19.7 3.4-5.9h13.6l-3.4 5.9H5.2Z" fill="#4285F4" />
    </svg>
  );
}

export function ResumeViewer(): React.ReactElement {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [key, setKey] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedRef = useRef(false);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    loadedRef.current = false;
    setRetryCount((prev) => prev + 1);
    setKey((prev) => prev + 1); // Force iframe reload
  }, []);

  useEffect(() => {
    loadedRef.current = false;

    // Set a timeout to detect loading failures
    timeoutRef.current = setTimeout(() => {
      if (!loadedRef.current) {
        setIsLoading(false);
        // Auto-retry if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES) {
          logger.warn(
            `loading timeout; auto-retry ${retryCount + 1}/${MAX_RETRIES}`
          );
          handleRetry();
        } else {
          logger.error("loading failed after multiple retries");
          setHasError(true);
        }
      }
    }, LOADING_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, retryCount, handleRetry]);

  const handleIframeLoad = () => {
    loadedRef.current = true;
    setIsLoading(false);
    setHasError(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleIframeError = () => {
    loadedRef.current = true;
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Auto-retry on error if we haven't exceeded max retries
    if (retryCount < MAX_RETRIES) {
      logger.warn(`loading error; auto-retry ${retryCount + 1}/${MAX_RETRIES}`);
      setTimeout(() => handleRetry(), 1000); // Small delay before retry
    } else {
      logger.error("loading failed after multiple retries");
      setHasError(true);
    }
  };

  return (
    <div className="flex h-full w-full max-w-5xl flex-col items-center gap-3 p-4">
      <Card
        className="relative w-full max-w-4xl flex-1 gap-0 overflow-hidden rounded-xl border border-border/70 bg-card/60 py-0 shadow-sm ring-0"
        data-testid="resume-viewer"
      >
        <div className="absolute right-2 top-2 z-20 sm:right-3 sm:top-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                className="min-h-11 min-w-11 border-border/80 bg-background/90 shadow-md backdrop-blur-sm hover:bg-muted"
                size="icon-lg"
                variant="outline"
              >
                <a
                  aria-label="Open resume in Google Drive"
                  data-testid="resume-drive-link"
                  href={PDF_OPEN_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <GoogleDriveIcon />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent data-testid="resume-drive-tooltip" side="left">
              Open in Google Drive
            </TooltipContent>
          </Tooltip>
        </div>
        {isLoading && !hasError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/95 backdrop-blur-sm">
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <Spinner className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Loading {SITE_CONFIG.fullName}&apos;s resume...
              </p>
              {retryCount > 0 && (
                <p className="mt-2 text-xs text-muted-foreground/70">
                  Retry attempt {retryCount}/{MAX_RETRIES}
                </p>
              )}
            </div>
          </div>
        )}
        {hasError ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/95 px-4 backdrop-blur-sm">
            <Alert className="max-w-sm border-border/70 bg-muted/30 text-center">
              <AlertDescription className="text-muted-foreground">
                Unable to display PDF in browser.
              </AlertDescription>
              <div className="mt-3 flex justify-center">
                <Button onClick={handleRetry} size="sm" variant="secondary">
                  Try Again
                </Button>
              </div>
            </Alert>
          </div>
        ) : (
          <iframe
            key={key}
            src={PDF_PREVIEW_URL}
            title={`${SITE_CONFIG.fullName}'s resume`}
            className="w-full h-full"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            referrerPolicy="no-referrer"
          />
        )}
      </Card>
    </div>
  );
}
