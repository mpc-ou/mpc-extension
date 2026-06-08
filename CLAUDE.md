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
| Lint check | `pnpm lint:check` |
| Auto-fix lint | `pnpm lint:fix` (use `pnpm lint:fix:unsafe` for unsafe fixes) |

No test suite exists in this project.

## Architecture

This is a **Manifest V3 browser extension** (Chrome + Firefox) built with [WXT](https://wxt.dev/), React 19, TypeScript, and Tailwind CSS v4. It helps students of Ho Chi Minh City Open University track grades, schedules, tuition, and student info by scraping university portal pages. Permissions: `scripting`, `activeTab`, `storage`, `sidePanel`, `alarms`, `notifications`.

### Three Extension Contexts

**1. Background Service Worker** ([entrypoints/background/index.ts](entrypoints/background/index.ts))
- Message router with a `SCRAPER_REGISTRY` mapping message types → scraper functions, injected into the active portal tab via `browser.scripting.executeScript()` (wrapped in a 60s timeout)
- Also handles `_GET_CURRENT_URL`, `_OPEN_NEW_TAB`, `_NAVIGATE_TO_URL`, and sets side panel behavior

**2. Popup** ([entrypoints/popup/](entrypoints/popup/))
- Lightweight toolbar popup. Detects the current portal URL (`sv` / `kcq`), scrapes & imports data into stores via [use-import-actions.ts](entrypoints/popup/hooks/use-import-actions.ts), links to school input pages, and opens the Dashboard tab
- DOM scrapers live here under [entrypoints/popup/scrapers/](entrypoints/popup/scrapers/)

**3. Index Dashboard** ([entrypoints/index/](entrypoints/index/))
- Full-page React app opened in a new tab (`index.html`), with `AppSidebar` + hash-based routing over **7 pages**: Dashboard, ScorePlan ("Kế hoạch điểm số"), Calendar, Tuition, PersonalInfo, Settings, AboutUs
- Routes/nav defined in [entrypoints/index/types.ts](entrypoints/index/types.ts) (`DashboardRoute`, `NAV_ITEMS`, `BREADCRUMB_MAP`); first-run `OnboardingDialog`
- Communicates with background via `browser.runtime.sendMessage()`

### Data Flow

```
Popup (detect portal tab) → background (sendMessage) → SCRAPER_REGISTRY lookup →
executeScript injects scraper into portal tab → DOM scrape → back to popup →
saved to per-MSSV Zustand stores → Index dashboard reads the same stores
```

Message type constants are defined in [constants/chrome.ts](constants/chrome.ts) (e.g., `_GET_BASIC_INFO`, `_GET_POINT_DATA`, `_GET_USER_DATA`, `_GET_CLASS_CALENDAR_DATA`, `_GET_EXAM_CALENDAR_DATA`, `_GET_TUITION_DATA`).

### State Management

Prefix sync or local is refer to extension storage local/sync, not a name of key. Example `sync:global` is key `global` save in sync storage.

Zustand stores with tiered persistence:

| Store | File | Storage | Manages |
|-------|------|---------|---------|
| Global config | [store/use-global-store.ts](store/use-global-store.ts) | `sync:global` | Theme, fixedPoint, ignoreList, siteURLMapping, school-wide params (retakeRatioLimit, maxCreditsPerSemester, minCreditsPerSemester, maxCreditsWarning, maxCreditsSummer, drlWarningThreshold) |
| Current user | [store/use-current-user-store.ts](store/use-current-user-store.ts) | `local:currentUser` + `local:{MSSV}:avatar` | studentId, displayName, avatar (avatar stored in separate key, not in JSON) |
| User settings | [store/use-user-settings-store.ts](store/use-user-settings-store.ts) | `local:{MSSV}:userSettings` | trainingSemesters, totalProgramCredits (per-MSSV, switches with effectiveStudentId) |
| Grade data | [store/use-score-store.ts](store/use-score-store.ts) | `local:{MSSV}:pointData` | Semester scores, GPA calculations |
| Info data | [store/use-info-store.ts](store/use-info-store.ts) | `local:{MSSV}:userData` | Student profile, course data |
| Calendar data | [store/use-calendar-store.ts](store/use-calendar-store.ts) | `local:{MSSV}:studyCalendarData` / `local:{MSSV}:examCalendarData` | Class schedules, exam events |
| Tuition data | [store/use-tuition-store.ts](store/use-tuition-store.ts) | `local:{MSSV}:tuitionData` / `local:{MSSV}:scholarships` | Tuition summary, per-semester details, scholarships |

**Key pattern**: All per-user data stores use `effectiveStudentId` from `useCurrentUserStore` — supports view-only account switching.

**Storage keys** are not hardcoded — build them with the helpers in [constants/storage.ts](constants/storage.ts): `getScopedKey(studentId, suffix)` → `local:{MSSV}:{suffix}`, plus `getPointKey`, `getUserInfoKey`, `getStudyCalendarKey`, `getExamCalendarKey`, `getTuitionKey`, `getUserSettingsKey`, `getAvatarKey`, `getStudentKeys`.

### Academic Compute Module

[utils/academic-compute.ts](utils/academic-compute.ts) — pure functions, no side effects:
- `computeSummary(data, trainingSemesters)` — GPA + DRL summary
- `getAcademicRank(gpa4)` / `getTrainingRank(point)` — Vietnamese rank labels
- `computeSemesterGPA(sem)` / `computeCumulativeGPA(data, idx)` — per-semester/cumulative
- `countRetakeCredits(data)` / `getRetakeRisk(...)` — retake F credits + degree downgrade risk
- `getDrlWarnings(data, threshold)` — DRL below threshold consecutive semester warnings
- `getMaxCreditsForStudent(gpa4, ...)` — credit limits based on academic standing

Re-exported via [utils/score.ts](utils/score.ts) for backward compatibility.

[utils/tuition-compute.ts](utils/tuition-compute.ts) — tuition math:
- `computeTuitionStats(...)` — totals/paid/owed stats
- `getScholarshipRate(type)` / `computeScholarshipRefund(...)` — scholarship rates & refunds
- `getLatestAvgCreditCost(...)` — average cost per credit
- `formatVND(amount)` / `formatVNDCompact(amount)` — currency formatting

Other utils: [calendar-format.ts](utils/calendar-format.ts), [calendar-import.ts](utils/calendar-import.ts), [ics-utils.ts](utils/ics-utils.ts) (calendar ↔ ICS export/import), [excel-utils.ts](utils/excel-utils.ts), [encryption.ts](utils/encryption.ts) (Web Crypto AES for encrypted import/export), [markdown-params.ts](utils/markdown-params.ts), [info-format.ts](utils/info-format.ts).

### Structure Folders

- `types/*`: define global type and type of each feature
- `constants/*`: 
    - `constants/storage.ts` define all storage key use for extension
    - `constants/chrome.ts` define all message type, communication between popup, content script, background script
    - `constants/default.ts` store all default value of features like state of form, config of each feature,...
- `store/*`: store data of each feature with Zustand
- `utils/*`: contain reusable compute and format functions 

If feat so complex, each feature can define types, constants, utils, components,... folder inside feature folder.

### Content Scripts (DOM Scrapers)

Scrapers are standalone functions in [entrypoints/popup/scrapers/](entrypoints/popup/scrapers/). The background script imports them, registers them in `SCRAPER_REGISTRY`, and injects them into the active portal tab via `browser.scripting.executeScript()` (they run in the page context, so they must be self-contained — no outside imports at runtime):

- [basic-info-scraper.ts](entrypoints/popup/scrapers/basic-info-scraper.ts) — studentId / displayName / avatar (used to identify the current user)
- [score-scraper.ts](entrypoints/popup/scrapers/score-scraper.ts) — grades, scrapes `#excel-table`
- [info-scraper.ts](entrypoints/popup/scrapers/info-scraper.ts) — student profile, scrapes `app-thongtin-user`
- [calendar-scraper.ts](entrypoints/popup/scrapers/calendar-scraper.ts) — class & exam schedules (week-by-week DOM automation)
- [tuition-scraper.ts](entrypoints/popup/scrapers/tuition-scraper.ts) — tuition summary & details

### Target Sites

Defined in [constants/default.ts](constants/default.ts) (`_DEFAULT_SITE_URL_MAPPING`):
- `https://tienichsv.ou.edu.vn` — primary portal
- `https://tienichkcq.oude.edu.vn` — secondary campus portal

### UI Components

- `/components/ui/` — Shadcn/ui (Radix-based, auto-generated, excluded from linting)
- `/components/custom/` — project-specific reusable components (`app-sidebar`, `app-header`, `onboarding-dialog`, `export-calendar-dialog`, `user-menu`, etc.)
- Icons: Lucide React; notifications: Sonner; charts: Chart.js + react-chartjs-2

### Other Directories

- `hooks/` — shared React hooks ([use-confirm.tsx](hooks/use-confirm.tsx))
- `lib/` — [theme.ts](lib/theme.ts), [utils.ts](lib/utils.ts) (`cn` helper)
- `docs/` — [TUTORIAL.md](docs/TUTORIAL.md)
- `scripts/` — semantic-release helpers ([update-info.ts](scripts/update-info.ts), [update-wxt-config.ts](scripts/update-wxt-config.ts))

## Code Conventions

- **Linter/Formatter**: Biome (not ESLint/Prettier) — config in [biome.jsonc](biome.jsonc)
- **Commits**: Conventional Commits enforced by commitlint + husky (required for semantic-release versioning)
- **Path alias**: `@/*` maps to the repo root
- **Constants & Definitions**: When coding magic numbers, defining thresholds, or adding constant configuration functions, ALWAYS check the `constants/` directory (e.g., `constants/default.ts`) to reuse existing values or define them centrally.
- **Grade conversion**: 10-point → 4-point scale logic is in [utils/index.ts](utils/index.ts)
- **Build define**: `__MPC_KEY__` (from the `MPC_KEY` env var, defaults to `"MPC"`) is injected by [wxt.config.ts](wxt.config.ts) and used by [utils/encryption.ts](utils/encryption.ts) for encrypted import/export
- **Release**: Automated via semantic-release on push to `main`; updates `package.json`, `wxt.config.ts`, `CHANGELOG.md`, and `assets/data/info.json`
