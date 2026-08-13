import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { _SEMESTER_SHORT_REGEX, _SEMESTER_TITLE_REGEX } from "@/constants";
import { _DEFAULT_GRADE_COLORS, _DEFAULT_MAX_SEMESTER_TERMS } from "@/constants/default";
import type { ScoreGroupType, ScoreRecordType, ScoreSummaryType } from "@/types";
import { computeSummary as computeAcademicSummary } from "./academic-compute";
import { removeVietnameseTones } from "./index";

/** Fallback match key for subjects with different codes but same name+credit. */
export function normalizeSubjectName(name: string): string {
  return removeVietnameseTones(name.trim()).replace(/\s+/g, "-").replace(/-+/g, "-");
}

/** Match two subjects by code+name first, then optionally by normalized name + credit. */
export function isSameSubject(
  a: { code: string; name: string; credit: number },
  b: { code: string; name: string; credit: number },
  matchByName = true
): boolean {
  if (a.code === b.code && a.name === b.name) {
    return true;
  }
  if (!matchByName) {
    return false;
  }
  return normalizeSubjectName(a.name) === normalizeSubjectName(b.name) && a.credit === b.credit;
}

const checkImproveSubject = (d: ScoreGroupType, map: Record<string, ScoreRecordType[]>) => {
  for (const item of d.data) {
    if (!map[item.code]) {
      map[item.code] = [];
    }
    map[item.code].push(item);
  }

  for (const items of Object.values(map)) {
    if (items.length <= 1) {
      continue;
    }

    let maxItem = items[0];

    for (const item of items) {
      const score = item.point?.scale10 ?? Number.NEGATIVE_INFINITY;
      const maxScore = maxItem.point?.scale10 ?? Number.NEGATIVE_INFINITY;
      if (score > maxScore) {
        maxItem = item;
      }
    }

    for (const item of items) {
      if (item !== maxItem) {
        item.isIgnore = true;
        item.isImproved = true;
      }
    }
  }
};

const updateIgnoreSubject = (data: ScoreGroupType[], ignoreList: string[]) => {
  const codeMap: Record<string, ScoreRecordType[]> = {};

  const newData = data.map((d) => {
    d.data = d.data.map((item) => {
      const isIgnore = ignoreList.some((i) => item.code.includes(i));
      item.isIgnore = isIgnore;
      return item;
    });

    checkImproveSubject(d, codeMap);
    return d;
  });

  for (const d of newData) {
    d.data.sort((a, b) => {
      if (a.isIgnore) {
        return 1;
      }
      if (b.isIgnore) {
        return -1;
      }
      return 0;
    });
  }

  return newData;
};

type EligibleEntry = { semIdx: number; subIdx: number; sub: ScoreRecordType };

function resetImprovedFlags(data: ScoreGroupType[]): void {
  for (const sem of data) {
    for (const sub of sem.data) {
      if (sub.isImproved) {
        sub.isIgnore = false;
        sub.isImproved = false;
      }
    }
  }
}

function collectEligibleSubjects(data: ScoreGroupType[]): EligibleEntry[] {
  const allSubs: EligibleEntry[] = [];
  for (const [si, sem] of data.entries()) {
    for (const [sbi, sub] of sem.data.entries()) {
      if ((!sub.isIgnore || sub.isImproved) && sub.point.character !== "M") {
        allSubs.push({ semIdx: si, subIdx: sbi, sub });
      }
    }
  }
  return allSubs;
}

function applyManualImprovementLinkages(allSubs: EligibleEntry[], subMap: Map<string, ScoreRecordType>): Set<string> {
  const manuallyLinked = new Set<string>();
  for (const entry of allSubs) {
    const targetId = entry.sub.improvesSubjectId;
    if (targetId && subMap.has(targetId)) {
      const oldSub = subMap.get(targetId);
      if (oldSub) {
        const oldScore = oldSub.point.scale10 ?? 0;
        const newScore = entry.sub.point.scale10 ?? 0;

        if (newScore > oldScore) {
          oldSub.isIgnore = true;
          oldSub.isImproved = true;
          entry.sub.isIgnore = false;
          entry.sub.isImproved = true;
        } else {
          entry.sub.isIgnore = true;
          entry.sub.isImproved = true;
          oldSub.isIgnore = false;
          oldSub.isImproved = true;
        }

        manuallyLinked.add(entry.sub.id || "");
        manuallyLinked.add(oldSub.id || "");
      }
    }
  }
  return manuallyLinked;
}

function applyAutomaticImprovements(remainingSubs: EligibleEntry[]): void {
  const groups = new Map<string, EligibleEntry[]>();
  for (const entry of remainingSubs) {
    const key = `${normalizeSubjectName(entry.sub.name)}|${entry.sub.credit}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)?.push(entry);
  }

  for (const entries of groups.values()) {
    if (entries.length < 2) {
      continue;
    }
    entries.sort((a, b) => (b.sub.point.scale10 ?? 0) - (a.sub.point.scale10 ?? 0));
    const best = entries[0];
    best.sub.isImproved = true;
    best.sub.isIgnore = false;
    for (let i = 1; i < entries.length; i++) {
      entries[i].sub.isImproved = true;
      entries[i].sub.isIgnore = true;
    }
  }
}

function markImprovedSubjects(data: ScoreGroupType[]): ScoreGroupType[] {
  resetImprovedFlags(data);
  const allSubs = collectEligibleSubjects(data);
  const subMap = new Map<string, ScoreRecordType>();
  for (const entry of allSubs) {
    if (entry.sub.id) {
      subMap.set(entry.sub.id, entry.sub);
    }
  }

  const manuallyLinked = applyManualImprovementLinkages(allSubs, subMap);

  const remainingSubs = allSubs.filter(
    (entry) => !manuallyLinked.has(entry.sub.id || "") && entry.sub.point.character !== "M"
  );
  applyAutomaticImprovements(remainingSubs);

  return data;
}

const updateScoreAvg = (data: ScoreGroupType[]) => {
  const newData = data.map((d) => {
    const totalCredit = d.data.reduce((acc, curr) => {
      const isIgnoreCredit = curr.isIgnore || !curr.point.character || curr.point.character === "F";
      if (isIgnoreCredit) {
        return acc;
      }
      return acc + curr.credit;
    }, 0);

    const avg = d.data.reduce(
      (acc, curr) => {
        const point = curr.point;
        const credit = curr.credit;

        const isValidPoint =
          typeof credit === "number" &&
          typeof point.scale10 === "number" &&
          typeof point.scale4 === "number" &&
          !Number.isNaN(point.scale10) &&
          !Number.isNaN(point.scale4) &&
          !!point.character;

        if (!isValidPoint || curr.isIgnore || point.character === "M") {
          return acc;
        }

        return {
          point: {
            scale10: acc.point.scale10 + point.scale10 * credit,
            scale4: acc.point.scale4 + point.scale4 * credit
          },
          credit: acc.credit + credit
        };
      },
      {
        point: {
          scale10: 0,
          scale4: 0
        },
        credit: 0
      }
    );

    d.totalCredit = totalCredit;
    d.avgPoint = {
      scale10: avg.credit > 0 ? Number.parseFloat((avg.point.scale10 / avg.credit).toFixed(2)) : null,
      scale4: avg.credit > 0 ? Number.parseFloat((avg.point.scale4 / avg.credit).toFixed(2)) : null
    };

    return d;
  });

  return newData;
};

const handleExportScoreData = (data: ScoreGroupType[]) => {
  const _EXPORT_FILE_PREFIX = "bang_diem_mpc";
  const _EXPORT_SHEET_NAME = "Bảng điểm";
  const _EXPORT_COL_WIDTHS = [5, 30, 15, 50, 10, 10, 10, 10, 20];

  const worksheetData: (string | number)[][] = [];

  worksheetData.push([
    "STT",
    "Học kỳ",
    "Mã môn học",
    "Tên môn học",
    "Số tín chỉ",
    "Điểm hệ 10",
    "Điểm hệ 4",
    "Xếp loại",
    "Ghi chú (Không tính GPA)"
  ]);

  let stt = 1;

  for (const semester of data) {
    for (const subject of semester.data) {
      worksheetData.push([
        stt,
        semester.title,
        subject.code,
        subject.name,
        subject.credit,
        subject.point.scale10 ?? "N/A",
        subject.point.scale4 ?? "N/A",
        subject.point.character ?? "N/A",
        subject.isIgnore ? "Không tính" : ""
      ]);
      stt += 1;
    }
  }

  const workbook = XLSXUtils.book_new();
  const worksheet = XLSXUtils.aoa_to_sheet(worksheetData);

  worksheet["!cols"] = _EXPORT_COL_WIDTHS.map((w) => ({ width: w }));

  XLSXUtils.book_append_sheet(workbook, worksheet, _EXPORT_SHEET_NAME);
  XLSXWriteFile(workbook, `${_EXPORT_FILE_PREFIX}_${new Date().toISOString()}.xlsx`);
};

const formatSemesterShort = (title: string): string => {
  const match = title.match(_SEMESTER_SHORT_REGEX);
  if (match) {
    return `HK${match[1]} ${match[2]}-${match[3]}`;
  }
  return title;
};

const getScoreSummary = (data: ScoreGroupType[], trainingSemesters?: number): ScoreSummaryType =>
  computeAcademicSummary(data, trainingSemesters);

function getNextSemesterName(currentName: string): string | null {
  const match = currentName.match(_SEMESTER_TITLE_REGEX);
  if (!match) {
    return null;
  }
  let term = Number.parseInt(match[1], 10);
  let yearStart = Number.parseInt(match[2], 10);
  let yearEnd = Number.parseInt(match[3], 10);
  if (term === _DEFAULT_MAX_SEMESTER_TERMS) {
    term = 1;
    yearStart++;
    yearEnd++;
  } else {
    term++;
  }
  return `Học kỳ ${term} - Năm học ${yearStart} - ${yearEnd}`;
}

const GRADE_COLORS = _DEFAULT_GRADE_COLORS;

export {
  formatSemesterShort,
  getScoreSummary,
  getNextSemesterName,
  GRADE_COLORS,
  handleExportScoreData,
  markImprovedSubjects,
  updateIgnoreSubject,
  updateScoreAvg
};
