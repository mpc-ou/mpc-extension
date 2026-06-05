---
description: Apply comprehensive project context, architecture details, and coding style rules for all coding and debugging tasks in the repository.
applyTo: '**/*'
---

# Project Context

This project is a **Manifest V3 browser extension** (Chrome + Firefox) built with **WXT**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. It helps students track grades, schedules, and info by scraping university portal pages.

## Key Technologies & Architecture
- **State Management**: Zustand stores persisted to `chrome.storage.sync` (global) and `chrome.storage.local` (per-user data).
- **Storage tiers**: `sync:` for cross-device global settings; `local:{MSSV}:{suffix}` for per-user data (scores, info, calendar, userSettings); `local:{MSSV}:avatar` for avatar separately.
- **Data Flow**: Side Panel UI -> Background Service Worker -> Content Scripts (DOM scraping).
- **DOM Scrapers**: Injected inline via `browser.scripting.executeScript()`.

## Parameter System

When adding new computed values, thresholds, or configurable numbers:
1. **Types first**: Define types in `types/point.ts` (or appropriate file under `types/`). NEVER put `export type` in `constants/`.
2. **Defaults in `constants/default.ts`**: Only `export const _DEFAULT_*` values. Import types from `@/types`.
3. **School-wide params** → `useGlobalStore` (sync storage, editable in Settings)
4. **Per-user params** → `UserSettingsType` → `useUserSettingsStore` (local storage, scoped to MSSV)
5. **Compute logic** → `utils/academic-compute.ts` (pure functions, no side effects). Re-export via `utils/score.ts` for backward compat.
6. **Update SettingsPage** with editable inputs for new params.
7. **Update `assets/docs/cach_tinh_toan.md`** with `{{VAR_NAME}}` placeholders.
8. **Update AboutUsPage** `calcParams` to pass current values to the markdown renderer.

## Specific Coding Standards

### General Rules
- Explain **WHY**, not **WHAT**. Avoid obvious/verbose comments.
- No `// ======` section dividers. Use brief `// ── section ──` with Unicode box-drawing chars only in large files.
- Minimal JSDoc: public API methods get one-liner `/** Brief. */`; private methods are self-documenting.
- Empty catch blocks: use an inline `/* reason */` block comment, never leave a bare `{}`.
- Use `Promise.all` for parallel independent async work.
- Use `Map` for in-memory caches with simple key patterns like `${a}:${b}`.

### Project-Specific Rules
- **Formatting & Linting**: Use **Biome** (avoid ESLint/Prettier).
- **Path Aliasing**: Use `@/*` to map to the repository root.
- **Constants**: Always check the `constants/` directory (e.g., `constants/default.ts`) to reuse existing values or define new ones centrally. Types go in `types/`, not in `constants/`.
- **Storage keys**: Use the builder functions from `constants/storage.ts` (`getPointKey`, `getCalendarKey`, etc.) — never hardcode `local:{MSSV}:*` strings.
- **Error Handling**: Follow project patterns, especially considering content-script-to-background messaging.