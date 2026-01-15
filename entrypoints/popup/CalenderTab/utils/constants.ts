export const WEEK_YEAR_REGEX = /\d{2}\/\d{2}\/(\d{4})/;
export const DATE_MATCH_REGEX = /\((\d{2})\/(\d{2})\)/;
export const SUBJECT_CODE_REGEX = /\((.*?)\)/;
export const TIME_REGEX = /\d{2}:\d{2}/g;

// ==================== CATEGORY TYPES ====================

export const CATEGORY_TYPES = {
  COURSE: "COURSE",
  LAB: "LAB",
  EXAM: "EXAM",
  HOLIDAY: "HOLIDAY",
  LESSON: "LESSON",
  OTHER: "OTHER"
} as const;

export type CategoryType = (typeof CATEGORY_TYPES)[keyof typeof CATEGORY_TYPES];

// ==================== CATEGORY LABELS ====================

/** Vietnamese labels for calendar entry categories */
export const CATEGORY_LABELS: Record<string, string> = {
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
export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

// ==================== CATEGORY COLORS ====================

export const CATEGORY_COLORS: Record<string, string> = {
  COURSE: "bg-blue-500",
  LAB: "bg-green-500",
  EXAM: "bg-red-500",
  HOLIDAY: "bg-yellow-500",
  LESSON: "bg-purple-500",
  OTHER: "bg-gray-500"
};

// ==================== SUBJECT COLORS ====================

export const SUBJECT_COLOR_PALETTE = [
  "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950",
  "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-950",
  "border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-950",
  "border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-950",
  "border-pink-200 dark:border-pink-700 bg-pink-50 dark:bg-pink-950",
  "border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950"
];

export const SUBJECT_COLOR_DEFAULT = "border-gray-200 dark:border-gray-700";

// ==================== EXCEL CONFIGURATION ====================

export const EXCEL_COLUMN_CONFIG = [
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

export const EXCEL_MAX_SHEET_NAME_LENGTH = 31;

// ==================== ICS CONFIGURATION ====================

export const ICS_METADATA = {
  VERSION: "2.0",
  PRODID: "-//MPC Extension//Calendar//EN",
  CALSCALE: "GREGORIAN",
  METHOD: "PUBLISH",
  CALENDAR_NAME: "Thời Khóa Biểu",
  TIMEZONE: "Asia/Ho_Chi_Minh"
};

export const ICS_UID_DOMAIN = "mpc-extension";
