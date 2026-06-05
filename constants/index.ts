export const _REPORT_BUG_URL: string = "https://youtu.be/dQw4w9WgXcQ" as const;

export const GRADE_ORDER = ["F", "D", "D+", "C", "C+", "B", "B+", "A", "A+"] as const;

export const _FACEBOOK_URL: string = "https://www.facebook.com/CLBLapTrinhTrenThietBiDiDong" as const;
export const _MESSENGER_URL: string = "https://m.me/168697773726618" as const;
export const _GITHUB_URL: string = "https://github.com/mpc-ou/mpc-extension" as const;
export const _GITHUB_RELEASE_URL: string = "https://github.com/mpc-ou/mpc-extension/releases" as const;

const _CHROME_STORAGE_TYPE: _CHROME_STORAGE_CATE = "local";
/** Sync-first global settings key — falls back to local if sync is unavailable. */
export const _CHROME_STORAGE_GLOBAL_SYNC_KEY = "sync:global" as const;
export const _CHROME_STORAGE_GLOBAL_LOCAL_KEY = "local:global" as const;
export const _CHROME_STORAGE_POINT_KEY = `${_CHROME_STORAGE_TYPE}:pointData` as const;
export const _WEEK_YEAR_REGEX = /\d{2}\/\d{2}\/(\d{4})/;
export const _DATE_MATCH_REGEX = /\((\d{2})\/(\d{2})\)/;
export const _SUBJECT_CODE_REGEX = /\((.*?)\)/;
export const _WEEK_MATCH_REGEX = /Tuần \(\d{2}\/\d{2}\/(\d{4}) - \d{2}\/\d{2}\/(\d{4})\)/;
export const _WEEK_SORT_REGEX = /Tuần \((\d{2})\/(\d{2})\/(\d{4})\)/;
export const _DATE_RANGE_REGEX = /(\d{2}\/\d{2}\/\d{2})\s*đến\s*(\d{2}\/\d{2}\/\d{2})/;
export const _SINGLE_DATE_REGEX = /(\d{2}\/\d{2}\/\d{2})/;

// ==================== CATEGORY TYPES ====================

export const _CATEGORY_TYPES = {
  COURSE: "COURSE",
  LAB: "LAB",
  EXAM: "EXAM",
  HOLIDAY: "HOLIDAY",
  LESSON: "LESSON",
  OTHER: "OTHER"
} as const;

// ==================== CATEGORY LABELS ====================

/** Vietnamese labels for calendar entry categories */
export const _CATEGORY_LABELS: Record<string, string> = {
  COURSE: "Học",
  LAB: "Thực hành",
  EXAM: "Thi",
  HOLIDAY: "Nghỉ",
  LESSON: "Bài học",
  OTHER: "Khác"
};

/**
 * Get Vietnamese label for a category
 * @param category - Category type
 * @returns Vietnamese label or the original category if not found
 */
export function _getCategoryLabel(category: string): string {
  return _CATEGORY_LABELS[category] || category;
}

// ==================== CATEGORY COLORS ====================

export const _CATEGORY_COLORS: Record<string, string> = {
  COURSE: "bg-blue-500",
  LAB: "bg-green-500",
  EXAM: "bg-red-500",
  HOLIDAY: "bg-yellow-500",
  LESSON: "bg-purple-500",
  OTHER: "bg-gray-500"
};

// ==================== SUBJECT COLORS ====================

export const _SUBJECT_COLOR_PALETTE = [
  "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950",
  "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-950",
  "border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-950",
  "border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-950",
  "border-pink-200 dark:border-pink-700 bg-pink-50 dark:bg-pink-950",
  "border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950"
];

export const _SUBJECT_COLOR_DEFAULT = "border-gray-200 dark:border-gray-700";

export const _SUBJECT_HEX_PALETTE = [
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#a855f7", // purple-500
  "#f97316", // orange-500
  "#ec4899", // pink-500
  "#6366f1", // indigo-500
  "#ef4444", // red-500
  "#14b8a6" // teal-500
];

export const _SUBJECT_HEX_DEFAULT = "#6b7280"; // gray-500

// ==================== EXCEL CONFIGURATION ====================

export const _EXCEL_COLUMN_CONFIG = [
  { header: "Tuần", width: 20 },
  { header: "Ngày", width: 15 },
  { header: "Tiết", width: 10 },
  { header: "Thời gian", width: 15 },
  { header: "Môn học", width: 30 },
  { header: "Mã môn", width: 12 },
  { header: "Nhóm", width: 10 },
  { header: "Phòng", width: 12 },
  { header: "Giảng viên", width: 25 },
  { header: "Loại", width: 12 }
];

export const _EXCEL_MAX_SHEET_NAME_LENGTH = 31;

// ==================== ICS CONFIGURATION ====================

export const _ICS_METADATA = {
  VERSION: "2.0",
  PRODID: "-//MPC Extension//Calendar//EN",
  CALSCALE: "GREGORIAN",
  METHOD: "PUBLISH",
  CALENDAR_NAME: "Thời Khóa Biểu",
  TIMEZONE: "Asia/Ho_Chi_Minh"
};

export const _ICS_UID_DOMAIN = "mpc-extension";
