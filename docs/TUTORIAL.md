# MPC Extension — Developer Tutorial

> How to add new features & support new sites with minimal duplication.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Side Panel (entrypoints/index/)                        │
│  React 19 + Tailwind v4                                 │
│  Pages: Dashboard, ScorePlan, Calendar, Tuition, etc.   │
│  ↕ browser.runtime.sendMessage()                        │
├─────────────────────────────────────────────────────────┤
│  Background Service Worker (entrypoints/background/)    │
│  Message router → injects scrapers into active tab      │
│  ↕ browser.scripting.executeScript()                    │
├─────────────────────────────────────────────────────────┤
│  Content Scrapers (entrypoints/popup/scrapers/)         │
│  Injected functions that scrape DOM from portal pages   │
│  ↕ returns structured data                              │
└─────────────────────────────────────────────────────────┘
```

**Data persistence — Zustand + `browser.storage`:**
- `sync:global` — cross-device settings (theme, site config, school params)
- `local:{studentId}:pointData` — per-user academic scores
- `local:{studentId}:calendarData` — per-user class schedule
- ...(see `constants/storage.ts` → `_DATA_SUFFIXES`)

---

## File Roles & Scope Rules

### Constants (`constants/`)

| File | Role | Can user override? |
|------|------|---------------------|
| `constants/index.ts` | **System-level hardcoded config.** Regex patterns, category types, color palettes — change requires editing code. | ❌ No |
| `constants/default.ts` | **Default values for runtime variables.** Initial GPA scale, credit limits — stored in `useGlobalStore` / `useUserSettingsStore` and can be changed via Settings UI. | ✅ Yes |
| `constants/chrome.ts` | Message type constants (`_GET_POINT_DATA`, etc.) | ❌ No |
| `constants/storage.ts` | Storage key builders (`getPointKey()`, etc.) + `_DATA_SUFFIXES` | ❌ No |
| `constants/io.ts` | File-import regex & size limits | ❌ No |

**Rule of thumb:** If a value can be changed in the Settings page → `constants/default.ts`. If changing it requires modifying the scraper logic or message protocol → `constants/index.ts`.

### Types (`types/`)

| Scope | Location |
|-------|----------|
| Shared across multiple pages/stores | `types/point.ts`, `types/user.ts`, `types/calendar.ts`, etc. |
| Used only by one module | Keep in that module's directory, e.g. `entrypoints/index/pages/CalendarPage/types.ts` |
| Global ambient types | `types/global.d.ts` (site config types: `_SITE_CATE`, `_SITE_CONFIG`, etc.) |

### Naming Convention

- **Internal constants**: `_UPPER_SNAKE_CASE` (e.g., `_DEFAULT_FIXED_POINT`, `_GET_POINT_DATA`)
- **Exported functions**: `camelCase` (e.g., `getPointKey()`, `computeSummary()`)
- **React components**: `PascalCase` (e.g., `ScorePlanPage`, `ThemeToggle`)
- **Types**: `PascalCase` suffix `Type` for object types (e.g., `ScoreRecordType`)

---

## Tutorial A: Adding a Feature on the Existing Portal

**Scenario:** You want to add "Attendance tracking" to the Tiện ích SV portal.

### Step 1: Define types

If types are shared across modules → `types/attendance.ts`:

```ts
// types/attendance.ts
export type AttendanceRecordType = {
  date: string;
  subjectCode: string;
  status: "present" | "absent" | "late";
};

export type AttendanceStorageType = {
  data: AttendanceRecordType[];
  updatedAt: string;
};
```

Export from barrel: add `export * from "./attendance";` to `types/index.ts`.

If types are ONLY used by the Attendance page → `entrypoints/index/pages/AttendancePage/types.ts`.

### Step 2: Add storage key suffix

```ts
// constants/storage.ts — add to _DATA_SUFFIXES
export const _DATA_SUFFIXES = [
  "userData",
  "pointData",
  "calendarData",
  "examData",
  "tuitionData",
  "userSettings",
  "attendanceData"  // ← NEW
] as const;

// Add convenience key builder
export const getAttendanceKey = (studentId: string) =>
  getScopedKey(studentId, "attendanceData");
```

### Step 3: Add message type constant

```ts
// constants/chrome.ts
export const _GET_ATTENDANCE_DATA = "getAttendanceData" as const;
```

### Step 4: Create the scraper function

```ts
// entrypoints/popup/scrapers/attendance-scraper.ts
import type { AttendanceRecordType } from "@/types";

async function getAttendanceData(): Promise<AttendanceRecordType[]> {
  // DOM scraping logic for the portal's attendance table
  const rows = document.querySelectorAll("#attendance-table tbody tr");
  return Array.from(rows).map((row) => {
    const cols = row.querySelectorAll("td");
    return {
      date: cols[0]?.textContent?.trim() || "",
      subjectCode: cols[1]?.textContent?.trim() || "",
      status: (cols[2]?.textContent?.trim() || "absent") as AttendanceRecordType["status"]
    };
  });
}

export { getAttendanceData };
```

### Step 5: Register in background service worker

```ts
// entrypoints/background/index.ts
import { getAttendanceData } from "@/entrypoints/popup/scrapers/attendance-scraper";

const SCRAPER_REGISTRY: Record<string, () => unknown | Promise<unknown>> = {
  [_GET_POINT_DATA]: getPointData,
  [_GET_USER_DATA]: getUserData,
  [_GET_BASIC_INFO]: getBasicInfo,
  [_GET_CLASS_CALENDAR_DATA]: getCalendars,
  [_GET_EXAM_CALENDAR_DATA]: getExamCalendars,
  [_GET_TUITION_DATA]: getTuitionData,
  [_GET_ATTENDANCE_DATA]: getAttendanceData  // ← NEW
};
```

That's it for the background — the `executeScraper()` helper handles the rest.

### Step 6: Create Zustand store

```ts
// store/use-attendance-store.ts
import { create } from "zustand";
import { getAttendanceKey } from "@/constants/storage";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import type { AttendanceRecordType, AttendanceStorageType } from "@/types";

type AttendanceState = {
  data: AttendanceRecordType[];
  lastUpdate: Date | null;
  setData: (data: AttendanceRecordType[]) => void;
  getData: () => Promise<void>;
  saveData: (studentId?: string) => Promise<void>;
  clearData: () => Promise<void>;
};

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  data: [],
  lastUpdate: null,
  setData: (data) => set({ data }),
  getData: async () => {
    const sid = useCurrentUserStore.getState().studentId;
    if (!sid) return;
    const key = getAttendanceKey(sid);
    const saved = await storage.getItem<AttendanceStorageType>(key);
    if (saved?.data) set({ data: saved.data, lastUpdate: saved.updatedAt ? new Date(saved.updatedAt) : null });
  },
  saveData: async (sid?: string) => {
    const key = getAttendanceKey(sid || useCurrentUserStore.getState().studentId);
    await storage.setItem(key, { data: get().data, updatedAt: new Date().toISOString() });
  },
  clearData: async () => {
    const key = getAttendanceKey(useCurrentUserStore.getState().studentId);
    await storage.removeItem(key);
    set({ data: [], lastUpdate: null });
  }
}));
```

### Step 7: Create the UI page

```tsx
// entrypoints/index/pages/AttendancePage/index.tsx
import { useEffect } from "react";
import { useAttendanceStore } from "@/store/use-attendance-store";

export function AttendancePage() {
  const { data, getData } = useAttendanceStore();

  useEffect(() => { getData(); }, [getData]);

  if (data.length === 0) {
    return <EmptyState message="Chưa có dữ liệu điểm danh" />;
  }

  return (
    <div>
      {/* your table / UI */}
    </div>
  );
}
```

### Step 8: Add route & navigation

```ts
// entrypoints/index/types.ts
export type DashboardRoute =
  | "dashboard"
  | "score-plan"
  | "calendar"
  | "tuition"
  | "settings"
  | "personal-info"
  | "about-us"
  | "attendance";  // ← NEW

export const NAV_ITEMS: SidebarNavItem[] = [
  // ...existing items
  { key: "attendance", label: "Điểm danh", icon: ClipboardCheck },
];

export const BREADCRUMB_MAP: Record<DashboardRoute, string[]> = {
  // ...existing entries
  attendance: ["MPC", "Điểm danh"],
};
```

### Step 9: Wire page into the side panel

```tsx
// entrypoints/index/app.tsx
import { AttendancePage } from "./pages/AttendancePage";

// Add store initialization
const getAttendanceData = useAttendanceStore((s) => s.getData);

// In useLayoutEffect init:
await getAttendanceData();

// In useEffect reload:
Promise.all([..., getAttendanceData()]);

// In renderPage switch:
case "attendance":
  return <AttendancePage />;
```

### Step 10: Add import action in popup

```ts
// entrypoints/popup/hooks/use-import-actions.ts
import { _GET_ATTENDANCE_DATA } from "@/constants/chrome";
import { useAttendanceStore } from "@/store/use-attendance-store";

// Add import handler
const handleImportAttendance = async () => {
  setIsLoading(true);
  try {
    const data = await browser.runtime.sendMessage({ type: _GET_ATTENDANCE_DATA });
    if (data && !data.error) {
      useAttendanceStore.getState().setData(data);
      await useAttendanceStore.getState().saveData(studentId);
      toast.success("Lấy dữ liệu điểm danh thành công!");
    }
  } catch (e) {
    toast.error("Lỗi khi lấy dữ liệu điểm danh");
  } finally {
    setIsLoading(false);
  }
};
```

### Step 11: Add to popup UI

Add a new section in `entrypoints/popup/components/popup-content.tsx` (like the existing `ScoreSection`, `TuitionSection`, etc.).

---

## Tutorial B: Supporting a Completely New Site

**Scenario:** You want to support VLU (Văn Lang University) portal at `https://vlu.edu.vn`.

### Step 1: Add site type

```ts
// types/global.d.ts
type _SITE_CATE = "sv" | "kcq" | "vlu";  // ← add "vlu"
```

### Step 2: Add site config

```ts
// constants/default.ts — add to _DEFAULT_SITE_URL_MAPPING
export const _DEFAULT_SITE_URL_MAPPING: _SITE_MAPPING = {
  sv: _createSiteConfig(/* ...existing... */),
  kcq: _createSiteConfig(/* ...existing... */),
  vlu: _createSiteConfig(
    "Văn Lang University",
    "https://vlu.edu.vn",
    "^https:\\/\\/vlu\\.edu\\.vn(?:\\/[^#]*)?",
    {
      point: { tailUrl: "#/diem", label: "Bảng điểm" },
      classCalendar: { tailUrl: "#/tkb", label: "Lịch học" },
      examCalendar: { tailUrl: "#/lichthi", label: "Lịch thi" },
      tuition: { tailUrl: "#/hocphi", label: "Học phí" },
      info: { tailUrl: "#/thongtin", label: "Thông tin cá nhân" }
    }
  )
};
```

### Step 3: Grant host permissions

```json
// wxt.config.ts → manifest.host_permissions
"host_permissions": [
  "https://tienichsv.ou.edu.vn/*",
  "https://tienichkcq.oude.edu.vn/*",
  "https://vlu.edu.vn/*"  // ← NEW
]
```

### Step 4: Update site detection in popup

```tsx
// entrypoints/popup/app.tsx
const [siteCurr, setSiteCurr] = useState<"sv" | "kcq" | "vlu" | null>(null);
//                                              ^^^^^^^ NEW
```

### Step 5: Update Settings URL config

```tsx
// entrypoints/index/pages/SettingsPage/components/url-config.tsx
{(["sv", "kcq", "vlu"] as _SITE_CATE[]).map((siteKey) => (  // ← add "vlu"
```

### Step 6: Create scrapers (if DOM differs)

If the VLU portal uses the same HTML structure as OU (same table IDs, same CSS classes), **reuse the existing scrapers** — no changes needed.

If the DOM is different, create site-specific scrapers:

```ts
// entrypoints/popup/scrapers/vlu-score-scraper.ts
async function getVluPointData(): Promise<ScoreGroupType[]> {
  // VLU-specific DOM scraping
  const rows = document.querySelectorAll("#diem-table tbody tr");
  // ...
}

export { getVluPointData };
```

Then register in the background with a site-specific message type:

```ts
// constants/chrome.ts
export const _GET_VLU_POINT_DATA = "getVluPointData" as const;

// background/index.ts
import { getVluPointData } from "@/entrypoints/popup/scrapers/vlu-score-scraper";

const SCRAPER_REGISTRY = {
  // ...
  [_GET_VLU_POINT_DATA]: getVluPointData,
};
```

### Step 7 (ideal future): Data-driven site detection

Currently the popup hardcodes `"sv" | "kcq" | "vlu"`. To make this data-driven:

```tsx
// popup/app.tsx — iterate over config keys
const siteEntries = Object.entries(siteURLMapping) as [_SITE_CATE, _SITE_CONFIG][];
for (const [key, config] of siteEntries) {
  if (isMatchURL(config.homepage.regex, config.homepage.url, currURL)) {
    setSiteCurr(key);
    break;
  }
}
```

This eliminates the hardcoded type union — `_SITE_CATE` becomes `keyof typeof _DEFAULT_SITE_URL_MAPPING`.

---

## Minimizing Duplication: Checklist

| When adding... | Touch these files | Min count |
|---------------|-------------------|-----------|
| **Feature on existing site** | `types/`, `constants/chrome.ts`, `constants/storage.ts`, scraper, `background/index.ts` (1 line), store, page component, `index/types.ts`, `index/app.tsx` (3 lines), popup import action, popup UI section | ~10 |
| **New site with same DOM** | `types/global.d.ts`, `constants/default.ts`, `wxt.config.ts`, popup `app.tsx` (1 line), Settings `url-config.tsx` (1 line) | **5 files** |
| **New site with different DOM** | Above + new scrapers + new message types + background registry entries | ~8 |

### Future improvements to reduce this further:

1. **Plugin-style feature registry** — define a `Feature` interface; each feature registers its store, page, scraper, and route in one file. The side panel and popup auto-discover registered features.

2. **Data-driven `_SITE_CATE`** — derive the type from `_DEFAULT_SITE_URL_MAPPING` keys instead of a hardcoded union.

3. **CSS selector config** — move scraper selectors into the site config so a new site can reuse scraper logic with different selectors.

---

## Quick Reference: Key Files Map

```
constants/
  chrome.ts          ← Message types (_GET_*)
  storage.ts         ← Storage key builders + _DATA_SUFFIXES
  default.ts         ← Default values (overridable via Settings)
  index.ts           ← System config (regex, colors, category types)
  io.ts              ← File import config

types/
  point.ts           ← Score/GPA types
  user.ts            ← User profile types
  calendar.ts        ← Schedule types
  tuition.ts         ← Tuition types
  site.ts            ← Tab category (legacy)
  global.d.ts        ← Site config ambient types

store/
  use-global-store.ts     ← Sync storage, school-wide params
  use-score-store.ts      ← Per-user scores
  use-calendar-store.ts   ← Per-user schedules
  use-tuition-store.ts    ← Per-user tuition
  use-info-store.ts       ← Per-user profile
  use-current-user-store.ts ← Current logged-in student
  use-user-settings-store.ts ← Per-user preferences

entrypoints/
  background/index.ts     ← Message router + scraper registry
  popup/app.tsx           ← Popup UI (import actions)
  popup/scrapers/         ← DOM scraper functions
  popup/hooks/use-import-actions.ts ← Import button handlers
  index/app.tsx           ← Side panel root
  index/types.ts          ← Route definitions + nav items
  index/pages/            ← Page components
```

---

## Security & Data Packaging (`.mpcext`)

To allow users to seamlessly backup and migrate their academic records across machines without compromising personal data privacy, MPC Extension implements a highly secure, encrypted data container format: `.mpcext`.

### Key Design & Encryption Strategy
1. **Zero-Dependency Native Web Crypto**: Utilizes the modern browser Web Crypto API (`window.crypto.subtle`) to guarantee top performance and avoid linter or bundle-bloat concerns.
2. **AES-GCM-256 with PBKDF2**:
   - Master key is fetched dynamically from `__MPC_KEY__` (configured via Vite).
   - A unique 16-byte random salt is generated for each export.
   - The password is derived using `PBKDF2` (SHA-256, 100,000 iterations) to produce a 256-bit symmetric key.
   - Plaintext data is encrypted using `AES-GCM` with a 12-byte cryptographically secure random IV.
   - The output file structure combines `Salt (16 bytes) | IV (12 bytes) | Encrypted Ciphertext` into a single Base64 encoded payload.

### Environmental Key Configuration (`wxt.config.ts`)
The `__MPC_KEY__` secret is injected dynamically at compile-time:
```ts
// wxt.config.ts
vite: () => ({
  define: {
    __MPC_KEY__: JSON.stringify(process.env.MPC_KEY || "MPC")
  }
})
```
- **Local Dev**: Loads `MPC_KEY` from the root `.env` file.
- **CI/CD Build**: The GitHub Actions / release pipeline automatically injects the production `MPC_KEY` secret.
