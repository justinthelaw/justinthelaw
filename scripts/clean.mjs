import { rm } from "node:fs/promises";

for (const target of ["out", "test-results", "playwright-report", ".next", "test-results.json"]) {
  await rm(target, { recursive: true, force: true });
}
