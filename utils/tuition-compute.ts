import { _DEFAULT_IGNORE_SUBJECT_DATA } from "@/constants/default";
import type { ScholarshipType, SemesterTuitionDetail, TuitionStatsType, TuitionSummaryEntry } from "@/types";

const SEMESTER_RE = /Học kỳ\s+(\d+)\s+(?:-\s*)?Năm học\s+(\d{4})\s*[-–]\s*(\d{4})/;

function isIgnoredSubject(code: string): boolean {
  return code.startsWith("_") || _DEFAULT_IGNORE_SUBJECT_DATA.some((p) => code.includes(p));
}

type CreditStats = {
  totalCredits: number;
  totalCreditsWithOther: number;
  avgPerCredit: number;
  minPerCredit: number;
  maxPerCredit: number;
};

function collectRates(groups: SemesterTuitionDetail["receiptGroups"]): { credits: number; rates: number[] } {
  let credits = 0;
  const rates: number[] = [];
  for (const group of groups) {
    if (group.receiptType === "B") {
      continue;
    }
    for (const item of group.items) {
      if (isIgnoredSubject(item.courseCode) || item.credits <= 0) {
        continue;
      }
      credits += item.credits;
      if (item.amount > 0) {
        rates.push(item.amount / item.credits);
      }
    }
  }
  return { credits, rates };
}

function computeCreditStats(details: Record<string, SemesterTuitionDetail>): CreditStats {
  let totalCredits = 0;
  let totalCreditsWithOther = 0;
  const allRates: number[] = [];

  for (const detail of Object.values(details)) {
    const { credits, rates } = collectRates(detail.receiptGroups);
    totalCredits += credits;
    for (const r of rates) {
      allRates.push(r);
    }
    for (const group of detail.receiptGroups) {
      for (const item of group.items) {
        if (item.credits > 0) {
          totalCreditsWithOther += item.credits;
        }
      }
    }
  }
  return {
    totalCredits,
    totalCreditsWithOther,
    avgPerCredit: allRates.length > 0 ? Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length) : 0,
    minPerCredit: allRates.length > 0 ? Math.round(Math.min(...allRates)) : 0,
    maxPerCredit: allRates.length > 0 ? Math.round(Math.max(...allRates)) : 0
  };
}

export function computeTuitionStats(
  summary: TuitionSummaryEntry[],
  details: Record<string, SemesterTuitionDetail>
): TuitionStatsType {
  const totalSpent = summary.reduce((acc, e) => acc + e.collected, 0);
  const totalDebt = summary.reduce((acc, e) => acc + e.debt, 0);
  const { totalCredits, totalCreditsWithOther, avgPerCredit, minPerCredit, maxPerCredit } = computeCreditStats(details);
  const semesterCount = summary.length;
  const avgPerSemester = semesterCount > 0 ? Math.round(totalSpent / semesterCount) : 0;

  let mostExpensive = { name: "", amount: 0 };
  let cheapest = { name: "", amount: Number.POSITIVE_INFINITY };

  for (const entry of summary) {
    if (entry.collected > mostExpensive.amount) {
      mostExpensive = { name: entry.semesterName, amount: entry.collected };
    }
    if (entry.collected < cheapest.amount && entry.collected > 0) {
      cheapest = { name: entry.semesterName, amount: entry.collected };
    }
  }
  if (cheapest.amount === Number.POSITIVE_INFINITY) {
    cheapest = { name: "", amount: 0 };
  }

  return {
    totalSpent,
    totalDebt,
    semesterCount,
    avgPerSemester,
    avgPerCredit,
    minPerCredit,
    maxPerCredit,
    totalCredits,
    totalCreditsWithOther,
    mostExpensiveSemester: mostExpensive,
    cheapestSemester: cheapest
  };
}

/** Items whose code starts with "_" are non-credit (BHYT, uniforms, etc.). */
export function isNonCreditItem(code: string): boolean {
  return code.startsWith("_");
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export function formatVNDCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const mils = amount / 1_000_000;
    return `${mils % 1 === 0 ? mils : mils.toFixed(1)}tr`;
  }
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}k`;
  }
  return `${amount}`;
}

export function getLatestAvgCreditCost(
  summary: TuitionSummaryEntry[],
  details: Record<string, SemesterTuitionDetail>
): number | null {
  if (summary.length === 0) {
    return null;
  }

  let latest: TuitionSummaryEntry | null = null;
  let latestNum = 0;
  let latestStartYear = 0;

  for (const entry of summary) {
    const m = entry.semesterName.match(SEMESTER_RE);
    if (!m) {
      continue;
    }
    const num = Number.parseInt(m[1], 10);
    const startYear = Number.parseInt(m[2], 10);
    if (startYear > latestStartYear || (startYear === latestStartYear && num > latestNum)) {
      latestStartYear = startYear;
      latestNum = num;
      latest = entry;
    }
  }

  if (!latest) {
    return null;
  }
  const detail = details[latest.semesterName];
  if (!detail) {
    return null;
  }

  const { rates } = collectRates(detail.receiptGroups);
  return rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null;
}

const SCHOLARSHIP_RATES: Record<NonNullable<ScholarshipType>, number> = {
  xuat_sac: 1.0,
  gioi: 0.7,
  kha: 0.5,
  mien_hoc_phi: 1.0
};

export function getScholarshipRate(type: NonNullable<ScholarshipType>): number {
  return SCHOLARSHIP_RATES[type];
}

export function computeScholarshipRefund(
  summary: TuitionSummaryEntry[],
  scholarships: Record<string, ScholarshipType>
): { total: number; semesterCount: number } {
  let total = 0;
  let semesterCount = 0;

  for (const entry of summary) {
    const sch = scholarships[entry.semesterName];
    if (!sch) {
      continue;
    }
    const rate = SCHOLARSHIP_RATES[sch];
    total += Math.round(entry.collected * rate);
    semesterCount++;
  }

  return { total, semesterCount };
}
