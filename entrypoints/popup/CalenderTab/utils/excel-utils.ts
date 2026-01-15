import type { WorkBook, WorkSheet } from "xlsx";
import { utils, write } from "xlsx";
import type { CalendarEntry, SemesterData, WeekData } from "../type";
import { EXCEL_COLUMN_CONFIG, EXCEL_MAX_SHEET_NAME_LENGTH, getCategoryLabel } from "./constants";

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

  rows.push(EXCEL_COLUMN_CONFIG.map((col) => col.header));

  for (const week of semester.weeks) {
    rows.push(...buildWeekRows(week));
  }

  return rows;
}

function buildWeekRows(week: WeekData): (string | number)[][] {
  return week.schedule.map((entry: CalendarEntry) => [
    week.week,
    entry.day,
    formatPeriod(entry.start_period, entry.end_period),
    formatTime(entry.start_time, entry.end_time),
    entry.title || "",
    entry.code || "",
    entry.group || "",
    entry.room || "",
    entry.teacher || "",
    getCategoryLabel(entry.category)
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

  worksheet["!cols"] = EXCEL_COLUMN_CONFIG.map((col) => ({ wch: col.width }));

  return worksheet;
}

function generateSheetName(semester: string, index: number): string {
  if (semester.length > EXCEL_MAX_SHEET_NAME_LENGTH) {
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
