import { read, utils } from "xlsx";
import { _PERIOD_TIME_MAP_GROUP_1, _PERIOD_TIME_MAP_GROUP_2 } from "@/constants/period-time";
import type { CalendarEntry, SemesterData, WeekData } from "@/types";

const STUDY_HEADERS = [
  "Mã MH",
  "Tên môn học",
  "Nhóm tổ",
  "Số tín chỉ",
  "Lớp",
  "Thứ",
  "Tiết bắt đầu",
  "Số tiết",
  "Phòng",
  "Giảng viên",
  "Thời gian học"
];

const EXAM_HEADERS = ["Stt", "Mã MH", "Tên môn học", "Nhóm thi"];

const DAY_PARTS_REGEX = /\((\d{2})\/(\d{2})\)/;
const YEAR_REGEX = /(\d{4})/;

type ImportResult = {
  data: SemesterData[];
  type: "study" | "exam";
};

function parseDateFromDDMMYY(str: string): Date {
  const [d, m, y] = str.split("/").map(Number);
  return new Date(2000 + y, m - 1, d);
}

function parseDateFromDDMMYYYY(str: string): Date {
  const [d, m, y] = str.split("/").map(Number);
  return new Date(y, m - 1, d);
}

function getDayOffset(dayStr: string): number {
  const upper = dayStr.toUpperCase();
  if (upper === "CN" || dayStr === "8") {
    return 0;
  }
  const n = Number.parseInt(dayStr, 10);
  return n >= 2 && n <= 7 ? n - 1 : -1;
}

function getWeekKey(date: Date): string {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const pad = (n: number) => String(n).padStart(2, "0");
  const sStr = `${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()}`;
  const eStr = `${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`;
  return `Tuần (${sStr} - ${eStr})`;
}

function getFormattedDay(date: Date, dayStr: string): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `Thứ ${dayStr} (${dd}/${mm})`;
}

function guessLocationType(room: string): {
  locationType: CalendarEntry["locationType"];
  timeMap: Record<number, { start: string; end: string }>;
} {
  const lower = room.trim().toUpperCase();
  if (lower.startsWith("NB") || lower.startsWith("LB")) {
    return { locationType: lower.startsWith("NB") ? "NB" : "LB", timeMap: _PERIOD_TIME_MAP_GROUP_2 };
  }
  return { locationType: "OTHER", timeMap: _PERIOD_TIME_MAP_GROUP_1 };
}

function studyEntryKey(e: CalendarEntry): string {
  return `${e.code}|${e.day}|${e.startPeriod}`;
}

function examEntryKey(e: CalendarEntry): string {
  return `${e.code}|${e.group}|${e.day}`;
}

export function detectExcelType(headers: string[]): "study" | "exam" | null {
  const h = headers.map((s) => s?.trim() || "");
  if (STUDY_HEADERS.every((sh) => h.includes(sh))) {
    return "study";
  }
  if (EXAM_HEADERS.every((sh) => h.includes(sh))) {
    return "exam";
  }
  return null;
}

export function parseStudyExcel(file: File, semesterName: string): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Excel parsing is inherently complex
    reader.onload = (e) => {
      try {
        const wb = read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];

        if (rows.length < 2) {
          throw new Error("File Excel trống");
        }

        const headers = rows[0] as string[];
        const entries: CalendarEntry[] = [];

        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.every((c) => !c)) {
            continue;
          }

          const code = String(r[0] || "").trim();
          const title = String(r[1] || "").trim();
          const group = String(r[2] || "").trim();
          const dayStr = String(r[5] || "").trim();
          const startPeriod = Number.parseInt(String(r[6] || "0"), 10) || 0;
          const numPeriods = Number.parseInt(String(r[7] || "0"), 10) || 0;
          const room = String(r[8] || "").trim();
          const teacher = String(r[9] || "").trim();
          const dateRangeStr = String(r[10] || "").trim();

          if (!(code && dayStr && startPeriod)) {
            continue;
          }

          const endPeriod = startPeriod + numPeriods - 1;
          const dayOffset = getDayOffset(dayStr);
          if (dayOffset < 0) {
            continue;
          }

          const { locationType, timeMap } = guessLocationType(room);
          const startTime = timeMap[startPeriod]?.start || "";
          const endTimeVal = timeMap[endPeriod]?.end || "";

          const dates = dateRangeStr.split("đến").map((s) => s.trim());
          const startDate = parseDateFromDDMMYY(dates[0]);
          const endDate = dates[1] ? parseDateFromDDMMYY(dates[1]) : new Date(startDate);

          if (Number.isNaN(startDate.getTime())) {
            continue;
          }

          const curr = new Date(startDate);
          while (curr <= endDate) {
            if (curr.getDay() === dayOffset) {
              entries.push({
                category: room.toUpperCase().includes("PM") ? "LAB" : "COURSE",
                eventType: "STUDY",
                locationType,
                day: getFormattedDay(curr, dayStr),
                startPeriod,
                endPeriod,
                startTime,
                endTime: endTimeVal,
                title,
                code,
                group,
                room,
                teacher
              });
            }
            curr.setDate(curr.getDate() + 1);
          }
        }

        if (entries.length === 0) {
          throw new Error("Không tìm thấy dữ liệu lịch học trong file");
        }

        const weekMap = new Map<string, CalendarEntry[]>();
        for (const entry of entries) {
          const dateParts = entry.day.match(DAY_PARTS_REGEX);
          if (!dateParts) {
            continue;
          }
          const d = Number.parseInt(dateParts[1], 10);
          const m = Number.parseInt(dateParts[2], 10) - 1;
          const yearMatch = semesterName.match(YEAR_REGEX);
          const year = yearMatch ? Number.parseInt(yearMatch[1], 10) : new Date().getFullYear();
          const date = new Date(year, m, d);
          const weekKey = getWeekKey(date);
          if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, []);
          }
          weekMap.get(weekKey)?.push(entry);
        }

        const weeks: WeekData[] = Array.from(weekMap.entries()).map(([week, schedule]) => ({ week, schedule }));

        resolve({ data: [{ semester: semesterName, weeks }], type: "study" });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Lỗi khi đọc file Excel"));
      }
    };
    reader.onerror = () => reject(new Error("Không thể đọc file"));
    reader.readAsArrayBuffer(file);
  });
}

export function parseExamExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Excel parsing is inherently complex
    reader.onload = (e) => {
      try {
        const wb = read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];

        if (rows.length < 4) {
          throw new Error("File Excel trống");
        }

        const semesterRaw = String(rows[2]?.[0] || "").trim();
        const semesterName = semesterRaw.startsWith("Kỳ thi:") ? semesterRaw.slice(7) : semesterRaw || "Lịch thi";

        const entries: CalendarEntry[] = [];

        for (let i = 3; i < rows.length; i++) {
          const r = rows[i];
          if (!r || r.every((c) => !c)) {
            continue;
          }

          const code = String(r[1] || "").trim();
          const title = String(r[2] || "").trim();
          const group = String(r[3] || "").trim();
          const dateRaw = String(r[5] || "").trim();
          const startTime = String(r[6] || "").trim();
          const room = String(r[7] || "").trim();
          const location = String(r[8] || "")
            .trim()
            .replace(/\n/g, " - ");
          const startPeriod = Number.parseInt(String(r[11] || "1"), 10) || 1;

          if (!(code && dateRaw)) {
            continue;
          }

          const date = parseDateFromDDMMYYYY(dateRaw);
          if (Number.isNaN(date.getTime())) {
            continue;
          }

          const dayOfWeek = date.getDay();
          const dayNames = ["CN", "2", "3", "4", "5", "6", "7"];
          const dd = String(date.getDate()).padStart(2, "0");
          const mm = String(date.getMonth() + 1).padStart(2, "0");
          const formattedDay = `Thứ ${dayNames[dayOfWeek]} (${dd}/${mm})`;

          entries.push({
            category: "EXAM",
            eventType: "EXAM",
            day: formattedDay,
            startPeriod,
            startTime,
            title,
            code,
            group,
            room: location ? `${room} - ${location}` : room
          });
        }

        if (entries.length === 0) {
          throw new Error("Không tìm thấy dữ liệu lịch thi trong file");
        }

        const weekMap = new Map<string, CalendarEntry[]>();
        for (const entry of entries) {
          const dateParts = entry.day.match(DAY_PARTS_REGEX);
          if (!dateParts) {
            continue;
          }
          const d = Number.parseInt(dateParts[1], 10);
          const m = Number.parseInt(dateParts[2], 10) - 1;
          const yearMatch = semesterName.match(YEAR_REGEX);
          const year = yearMatch ? Number.parseInt(yearMatch[1], 10) : new Date().getFullYear();
          const date = new Date(year, m, d);
          const weekKey = getWeekKey(date);
          if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, []);
          }
          weekMap.get(weekKey)?.push(entry);
        }

        const weeks: WeekData[] = Array.from(weekMap.entries()).map(([week, schedule]) => ({ week, schedule }));

        resolve({ data: [{ semester: semesterName, weeks }], type: "exam" });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Lỗi khi đọc file Excel"));
      }
    };
    reader.onerror = () => reject(new Error("Không thể đọc file"));
    reader.readAsArrayBuffer(file);
  });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: merge logic needs branching for study vs exam
export function mergeCalendarData(
  existing: SemesterData[],
  imported: SemesterData[],
  type: "study" | "exam"
): { merged: SemesterData[]; added: number; replaced: number } {
  const keyFn = type === "study" ? studyEntryKey : examEntryKey;
  let added = 0;
  let replaced = 0;

  for (const impSem of imported) {
    const existingSem = existing.find((s) => s.semester === impSem.semester);

    if (!existingSem) {
      existing.push(impSem);
      added += impSem.weeks.reduce((sum, w) => sum + w.schedule.length, 0);
      continue;
    }

    const entryMap = new Map<string, CalendarEntry>();
    for (const w of existingSem.weeks) {
      for (const e of w.schedule) {
        entryMap.set(keyFn(e), e);
      }
    }

    for (const impWeek of impSem.weeks) {
      let existingWeek = existingSem.weeks.find((w) => w.week === impWeek.week);
      if (!existingWeek) {
        existingSem.weeks.push(impWeek);
        added += impWeek.schedule.length;
        continue;
      }

      for (const impEntry of impWeek.schedule) {
        const key = keyFn(impEntry);
        const existingEntry = entryMap.get(key);

        if (existingEntry) {
          let changed = false;
          if (impEntry.room && impEntry.room !== existingEntry.room) {
            existingEntry.room = impEntry.room;
            changed = true;
          }
          if (impEntry.teacher && impEntry.teacher !== existingEntry.teacher) {
            existingEntry.teacher = impEntry.teacher;
            changed = true;
          }
          if (impEntry.startTime && impEntry.startTime !== existingEntry.startTime) {
            existingEntry.startTime = impEntry.startTime;
            changed = true;
          }
          if (changed) {
            replaced++;
          }
        } else {
          existingWeek.schedule.push(impEntry);
          added++;
        }
      }
    }
  }

  return { merged: existing, added, replaced };
}
