import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vitest runs unit tests only — the *.test.ts(x) convention, scoped to the
    // directories where they actually live. Vitest's default `include` matches
    // both *.test.* and *.spec.*, which would otherwise pull in:
    //  - Playwright specs in e2e/ (*.spec.ts) — those run via `npm run test:e2e`
    //    and crash under vitest ("Playwright Test did not expect test.describe()
    //    to be called here").
    //  - Stale git worktree copies under .claude/worktrees/.
    // Whitelisting the source dirs avoids both without enumerating excludes.
    include: [
      "src/**/*.test.{ts,tsx}",
      "tests/**/*.test.{ts,tsx}",
      "scripts/**/*.test.{ts,tsx}",
    ],
  },
});
