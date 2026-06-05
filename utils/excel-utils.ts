import type { WorkBook, WorkSheet } from "xlsx";
import { utils, write } from "xlsx";
import { _EXCEL_COLUMN_CONFIG, _EXCEL_MAX_SHEET_NAME_LENGTH, _getCategoryLabel } from "@/constants";
import type { CalendarEntry, SemesterData, WeekData } from "@/types";

export function convertToExcel(data: SemesterData[]): void {
  const workbook = buildWorkbook(data);
  downloadExcelFile(workbook);
}

function buildWorkbook(data: SemesterData[]): WorkBook {
  const workbook = utils.book_new();

  for (let index = 0; index < data.length; index++) {
    const semester = data[index];
    buildSemesterSheet(workbook, semester, index);
  }

  return workbook;
}

function buildSemesterSheet(workbook: WorkBook, semester: SemesterData, index: number): void {
  const rows = buildRows(semester);
  const worksheet = createWorksheet(rows);
  const sheetName = generateSheetName(semester.semester, index);

  utils.book_append_sheet(workbook, worksheet, sheetName);
}

function buildRows(semester: SemesterData): (string | number)[][] {
  const rows: (string | number)[][] = [];

  rows.push(_EXCEL_COLUMN_CONFIG.map((col) => col.header));

  for (const week of semester.weeks) {
    rows.push(...buildWeekRows(week));
  }

  return rows;
}

function buildWeekRows(week: WeekData): (string | number)[][] {
  return week.schedule.map((entry: CalendarEntry) => [
    week.week,
    entry.day,
    formatPeriod(entry.startPeriod, entry.endPeriod),
    formatTime(entry.startTime, entry.endTime),
    entry.title || "",
    entry.code || "",
    entry.group || "",
    entry.room || "",
    entry.teacher || "",
    _getCategoryLabel(entry.category)
  ]);
}

function formatPeriod(start: number | undefined, end: number | undefined): string {
  return start !== undefined && end !== undefined ? `${start} - ${end}` : "";
}

function formatTime(start: string | undefined, end: string | undefined): string {
  return start && end ? `${start} - ${end}` : start || "";
}

function createWorksheet(rows: (string | number)[][]): WorkSheet {
  const worksheet = utils.aoa_to_sheet(rows);

  worksheet["!cols"] = _EXCEL_COLUMN_CONFIG.map((col) => ({ wch: col.width }));

  return worksheet;
}

function generateSheetName(semester: string, index: number): string {
  if (semester.length > _EXCEL_MAX_SHEET_NAME_LENGTH) {
    return `HK${index + 1}_${semester.substring(0, 24)}`;
  }
  return semester;
}

function downloadExcelFile(workbook: WorkBook): void {
  const excelBuffer = write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lich-hoc-${new Date().toISOString().split("T")[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildCSVRow(week: WeekData, entry: CalendarEntry): string[] {
  return [
    week.week,
    entry.day,
    formatPeriod(entry.startPeriod, entry.endPeriod),
    formatTime(entry.startTime, entry.endTime),
    entry.title || "",
    entry.code || "",
    entry.group || "",
    entry.room || "",
    entry.teacher || "",
    _getCategoryLabel(entry.category)
  ];
}

/** Flatten semester data into CSV row arrays. */
function flattenCSVRows(data: SemesterData[]): string[][] {
  const headers = _EXCEL_COLUMN_CONFIG.map((c) => c.header);
  const rows: string[][] = [headers];

  for (const semester of data) {
    for (const week of semester.weeks) {
      for (const entry of week.schedule) {
        rows.push(buildCSVRow(week, entry));
      }
    }
  }

  return rows;
}

export function convertToCSV(data: SemesterData[]): void {
  const BOM = "\uFEFF";
  const rows = flattenCSVRows(data);

  const csv = BOM + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lich-hoc-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
