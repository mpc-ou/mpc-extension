import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import type { SemesterTuitionDetail, TuitionSummaryEntry } from "@/types";

const COLS = [
  { header: "STT", width: 6 },
  { header: "Học kỳ", width: 30 },
  { header: "Mã MH", width: 14 },
  { header: "Tên môn học", width: 35 },
  { header: "Nhóm", width: 8 },
  { header: "Tín chỉ", width: 8 },
  { header: "Số tiền", width: 16 }
];

export function handleExportTuitionData(
  summary: TuitionSummaryEntry[],
  details: Record<string, SemesterTuitionDetail>
) {
  const rows: (string | number)[][] = [COLS.map((c) => c.header)];

  let stt = 1;
  for (const entry of summary) {
    const detail = details[entry.semesterName];
    if (!detail) {
      continue;
    }
    for (const group of detail.receiptGroups) {
      if (group.receiptType === "B") {
        continue;
      }
      for (const item of group.items) {
        rows.push([stt++, entry.semesterName, item.courseCode, item.courseName, item.group, item.credits, item.amount]);
      }
    }
  }

  // Summary row
  const totalSpent = summary.reduce((acc, e) => acc + e.collected, 0);
  const totalDebt = summary.reduce((acc, e) => acc + e.debt, 0);
  rows.push([]);
  rows.push(["", "TỔNG ĐÃ ĐÓNG", "", "", "", "", totalSpent]);
  rows.push(["", "TỔNG CÒN NỢ", "", "", "", "", totalDebt]);

  const workbook = XLSXUtils.book_new();
  const worksheet = XLSXUtils.aoa_to_sheet(rows);
  worksheet["!cols"] = COLS.map((c) => ({ wch: c.width }));

  const amountCol = 6;
  for (let r = 1; r < rows.length; r++) {
    const cell = XLSXUtils.encode_cell({ r, c: amountCol });
    if (worksheet[cell] && typeof worksheet[cell].v === "number") {
      worksheet[cell].z = "#,##0";
    }
  }

  XLSXUtils.book_append_sheet(workbook, worksheet, "Học phí");
  XLSXWriteFile(workbook, `hoc_phi_mpc_${new Date().toISOString().split("T")[0]}.xlsx`);
}
