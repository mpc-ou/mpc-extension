# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Task | Command |
|------|---------|
| Dev (Chrome) | `pnpm dev` |
| Dev (Firefox) | `pnpm dev:firefox` |
| Build (Chrome) | `pnpm build` |
| Build (Firefox) | `pnpm build:firefox` |
| Package for distribution | `pnpm zip` / `pnpm zip:firefox` |
| Type check | `pnpm compile` |
| Lint check | `pnpm ultracite:check` |
| Auto-fix lint | `pnpm ultracite:fix` |

No test suite exists in this project.

## Architecture

This is a **Manifest V3 browser extension** (Chrome + Firefox) built with [WXT](https://wxt.dev/), React 19, TypeScript, and Tailwind CSS v4. It helps students of Ho Chi Minh City Open University track grades, schedules, and student info by scraping university portal pages.

### Two Extension Contexts

**1. Background Service Worker** ([entrypoints/background/index.ts](entrypoints/background/index.ts))
- Acts as a message router between the side panel and content scripts
- Injects content scripts into active tabs via `browser.scripting.executeScript()`
- Manages side panel behavior (opens on extension icon click)

**2. Side Panel UI** ([entrypoints/sidepanel/](entrypoints/sidepanel/))
- A React app with 5 tabs: Point, Info, Calendar, Statistic, Config
- Entry: [app.tsx](entrypoints/sidepanel/app.tsx) → detects current URL → routes user to relevant tab
- Communicates with background via `browser.runtime.sendMessage()`

### Data Flow

```
Side Panel → background (message) → content script injected into tab → DOM scrape → back to side panel
```

Message type constants are defined in [constants/chrome.ts](constants/chrome.ts) (e.g., `_GET_POINT_DATA`, `_GET_USER_DATA`, `_GET_CLASS_CALENDAR_DATA`).

### State Management

Zustand stores with tiered persistence:

| Store | File | Storage | Manages |
|-------|------|---------|---------|
| Global config | [store/use-global-store.ts](store/use-global-store.ts) | `sync:global` | Theme, fixedPoint, ignoreList, siteURLMapping, school-wide params (retakeRatioLimit, maxCreditsPerSemester, minCreditsPerSemester, maxCreditsWarning, maxCreditsSummer, drlWarningThreshold) |
| Current user | [store/use-current-user-store.ts](store/use-current-user-store.ts) | `local:currentUser` + `local:{MSSV}:avatar` | studentId, displayName, avatar (avatar stored in separate key, not in JSON) |
| User settings | [store/use-user-settings-store.ts](store/use-user-settings-store.ts) | `local:{MSSV}:userSettings` | trainingSemesters, totalProgramCredits (per-MSSV, switches with effectiveStudentId) |
| Grade data | [store/use-score-store.ts](store/use-score-store.ts) | `local:{MSSV}:pointData` | Semester scores, GPA calculations |
| Info data | [store/use-info-store.ts](store/use-info-store.ts) | `local:{MSSV}:userData` | Student profile, course data |
| Calendar data | [store/use-calendar-store.ts](store/use-calendar-store.ts) | `local:{MSSV}:calendarData` / `local:{MSSV}:examData` | Class schedules, exam events |

**Key pattern**: All per-user data stores use `effectiveStudentId` from `useCurrentUserStore` — supports view-only account switching.

### Academic Compute Module

[utils/academic-compute.ts](utils/academic-compute.ts) — pure functions, no side effects:
- `computeSummary(data, trainingSemesters)` — GPA + DRL summary
- `getAcademicRank(gpa4)` / `getTrainingRank(point)` — Vietnamese rank labels
- `computeSemesterGPA(sem)` / `computeCumulativeGPA(data, idx)` — per-semester/cumulative
- `countRetakeCredits(data)` / `getRetakeRisk(...)` — retake F credits + degree downgrade risk
- `getDrlWarnings(data, threshold)` — DRL below threshold consecutive semester warnings
- `getMaxCreditsForStudent(gpa4, ...)` — credit limits based on academic standing

Re-exported via [utils/score.ts](utils/score.ts) for backward compatibility.

### Parameter System (when adding new configurable values)

1. Define type in `types/point.ts`
2. Add default in `constants/default.ts`
3. School-wide → `useGlobalStore` (sync, editable in Settings); Per-user → `UserSettingsType` → `useUserSettingsStore`
4. Compute logic → `utils/academic-compute.ts`
5. Update `SettingsPage/index.tsx` with input
6. Update `assets/docs/cach_tinh_toan.md` with `{{VAR}}` placeholders
7. Update `AboutUsPage` `calcParams` for markdown rendering

### Content Scripts (DOM Scrapers)

Content scripts run inside university portal tabs and are **not loaded as separate files** — they are injected as inline functions by the background script:

- Grades: [entrypoints/sidepanel/PointTab/scripts/index.ts](entrypoints/sidepanel/PointTab/scripts/index.ts) — scrapes `#excel-table`
- User info: [entrypoints/sidepanel/InfoTab/scripts/index.ts](entrypoints/sidepanel/InfoTab/scripts/index.ts) — scrapes `app-thongtin-user`
- Calendar: [entrypoints/sidepanel/CalendarTab/scripts/index.ts](entrypoints/sidepanel/CalendarTab/scripts/index.ts) — complex week-by-week DOM automation

### Target Sites

Defined in [constants/default.ts](constants/default.ts) (`_DEFAULT_SITE_URL_MAPPING`):
- `https://tienichsv.ou.edu.vn` — primary portal
- `https://tienichkcq.oude.edu.vn` — secondary campus portal

### UI Components

- `/components/ui/` — Shadcn/ui (Radix-based, auto-generated, excluded from linting)
- `/components/custom/` — project-specific reusable components
- Icons: Lucide React; notifications: Sonner; charts: Chart.js + react-chartjs-2

## Code Conventions

- **Linter/Formatter**: Biome (not ESLint/Prettier) — config in [biome.jsonc](biome.jsonc)
- **Commits**: Conventional Commits enforced by commitlint + husky (required for semantic-release versioning)
- **Path alias**: `@/*` maps to the repo root
- **Constants & Definitions**: When coding magic numbers, defining thresholds, or adding constant configuration functions, ALWAYS check the `constants/` directory (e.g., `constants/default.ts`) to reuse existing values or define them centrally.
- **Grade conversion**: 10-point → 4-point scale logic is in [utils/index.ts](utils/index.ts)
- **Release**: Automated via semantic-release on push to `main`; updates `package.json`, `wxt.config.ts`, `CHANGELOG.md`, and `assets/data/info.json`
