import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  _CATEGORY_COLORS,
  _DATE_MATCH_REGEX,
  _SUBJECT_COLOR_DEFAULT,
  _SUBJECT_COLOR_PALETTE,
  _SUBJECT_HEX_DEFAULT,
  _SUBJECT_HEX_PALETTE,
  _WEEK_YEAR_REGEX
} from "@/constants";
import type { CalendarEntry, SemesterData } from "@/types";

export type DaySchedule = {
  date: Date;
  schedule: CalendarEntry[];
};

function extractYear(weekString: string): string {
  const weekYearMatch = weekString.match(_WEEK_YEAR_REGEX);
  return weekYearMatch ? weekYearMatch[1] : new Date().getFullYear().toString();
}

function extractDateParts(dayString: string): { day: string; month: string } | null {
  const dateMatch = dayString.match(_DATE_MATCH_REGEX);
  if (!dateMatch) {
    return null;
  }
  const [, day, month] = dateMatch;
  return { day, month };
}

function addEntryToMap(map: Map<string, CalendarEntry[]>, dateKey: string, entry: CalendarEntry): void {
  if (!map.has(dateKey)) {
    map.set(dateKey, []);
  }
  const entries = map.get(dateKey);
  if (entries) {
    entries.push(entry);
  }
}

export function buildScheduleMap(data: SemesterData[]): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>();

  for (const semester of data) {
    for (const weekData of semester.weeks) {
      const year = extractYear(weekData.week);

      for (const entry of weekData.schedule) {
        const dateParts = extractDateParts(entry.day);
        if (dateParts) {
          const paddedMonth = dateParts.month.padStart(2, "0");
          const paddedDay = dateParts.day.padStart(2, "0");
          const dateKey = `${year}-${paddedMonth}-${paddedDay}`;
          addEntryToMap(map, dateKey, entry);
        }
      }
    }
  }

  return map;
}

export function getScheduleForDate(date: Date, scheduleMap: Map<string, CalendarEntry[]>): CalendarEntry[] {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateKey = `${year}-${month}-${day}`;

  return scheduleMap.get(dateKey) || [];
}

export function hasSchedule(date: Date, scheduleMap: Map<string, CalendarEntry[]>): boolean {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateKey = `${year}-${month}-${day}`;

  const schedule = scheduleMap.get(dateKey);
  return Boolean(schedule && schedule.length > 0);
}

export function formatDate(date: Date): string {
  return format(date, "EEEE, dd/MM/yyyy", { locale: vi });
}

export function formatTime(time: string): string {
  return time || "";
}

export function getSubjectColor(code: string): string {
  const hash = code.split("").reduce((acc, char) => char.charCodeAt(0) + acc * 33, 0);
  return _SUBJECT_COLOR_PALETTE[Math.abs(hash) % _SUBJECT_COLOR_PALETTE.length] || _SUBJECT_COLOR_DEFAULT;
}

export function getSubjectHexColor(code: string): string {
  if (!code) {
    return _SUBJECT_HEX_DEFAULT;
  }
  const hash = code.split("").reduce((acc, char) => char.charCodeAt(0) + acc * 33, 0);
  return _SUBJECT_HEX_PALETTE[Math.abs(hash) % _SUBJECT_HEX_PALETTE.length] || _SUBJECT_HEX_DEFAULT;
}

export function getCategoryColor(category: string): string {
  return _CATEGORY_COLORS[category] || _CATEGORY_COLORS.OTHER;
}

export function getCategoryLabel(category?: string): string {
  switch (category) {
    case "COURSE":
      return "Lý thuyết";
    case "LAB":
      return "Thực hành";
    case "EXAM":
      return "Thi cử";
    case "HOLIDAY":
      return "Ngày nghỉ";
    default:
      return "Khác";
  }
}

export function getLocationLabel(location?: string): string {
  switch (location) {
    case "NB":
      return "Nhà Bè";
    case "MLA":
      return "Mai Thị Lựu";
    case "VVT":
      return "Võ Văn Tần";
    case "GP":
      return "Gia Phú";
    case "LB":
      return "Long Bình Tân";
    default:
      return location || "";
  }
}

/** Semester name parsed fields. */
export type ParsedSemester = { num: number; startYear: number; endYear: number };

const _SEMESTER_RE = /Học kỳ\s+(\d+)\s+(?:-\s*)?Năm học\s+(\d{4})\s*[-–]\s*(\d{4})/;

/** Normalize semester name for fuzzy comparison — collapses dashes and whitespace. */
export function normalizeSemesterName(name: string): string {
  return name.replace(/[-–]/g, " ").replace(/\s+/g, " ").trim();
}

/** Parse "Học kỳ X - Năm học YYYY - ZZZZ" (or variant) → { num, startYear, endYear } or null. */
export function parseSemesterName(name: string): ParsedSemester | null {
  const m = name.match(_SEMESTER_RE);
  if (!m) {
    return null;
  }
  return { num: Number.parseInt(m[1], 10), startYear: Number.parseInt(m[2], 10), endYear: Number.parseInt(m[3], 10) };
}

/** Short display form: "Học kỳ 1 - Năm học 2022 - 2023" → "HK 1 2022 - 2023". */
export function shortSemesterName(name: string): string {
  return name.replace("Học kỳ ", "HK").replace(" - Năm học ", " ");
}

/** Build canonical label from parsed fields. */
export function formatSemesterLabel(p: ParsedSemester): string {
  return `Học kỳ ${p.num} - Năm học ${p.startYear} - ${p.endYear}`;
}
