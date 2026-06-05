import { _DEFAULT_ACADEMIC_RANKS, _DEFAULT_TRAINING_RANKS } from "@/constants/default";
import type { ScoreGroupType, ScoreSummaryType } from "@/types";

export function computeSummary(data: ScoreGroupType[], trainingSemesters = 0): ScoreSummaryType {
  const totalCredit = data.reduce((acc, s) => acc + s.totalCredit, 0);

  let sum10 = 0;
  let sum4 = 0;
  let sumCr = 0;

  for (const sem of data) {
    for (const sub of sem.data) {
      const { credit, point } = sub;
      if (sub.isIgnore || !point.character) {
        continue;
      }
      if (typeof credit !== "number" || typeof point.scale10 !== "number" || typeof point.scale4 !== "number") {
        continue;
      }
      if (Number.isNaN(credit) || Number.isNaN(point.scale10) || Number.isNaN(point.scale4)) {
        continue;
      }
      sum10 += point.scale10 * credit;
      sum4 += point.scale4 * credit;
      sumCr += credit;
    }
  }

  const validSemesters = data.filter((s) => s.trainingPoint !== null && s.trainingPoint !== undefined);
  const limit = trainingSemesters > 0 ? Math.min(trainingSemesters, validSemesters.length) : validSemesters.length;
  const selected = validSemesters.slice(0, limit);
  const avgTraining =
    selected.length > 0 ? selected.reduce((acc, s) => acc + (s.trainingPoint ?? 0), 0) / selected.length : 0;

  return {
    semesterCount: data.length,
    totalCredit,
    totalSubject: data.reduce((acc, s) => acc + s.data.length, 0),
    gpa10: sumCr > 0 ? +(sum10 / sumCr) : 0,
    gpa4: sumCr > 0 ? +(sum4 / sumCr) : 0,
    avgTrainingPoint: avgTraining
  };
}

// ── Ranks ──

type Rank = { label: string; emoji: string; color: string; bg: string };
type TrainingRank = Rank & { minPoint: number };

export function getAcademicRank(gpa4: number): Rank {
  const found = _DEFAULT_ACADEMIC_RANKS.find((r) => gpa4 >= r.minGpa4);
  return (found?.rank ?? _DEFAULT_ACADEMIC_RANKS.at(-1)?.rank) as Rank;
}

export function getTrainingRank(point: number): TrainingRank {
  const found = _DEFAULT_TRAINING_RANKS.find((r) => point >= r.minPoint);
  return (found ?? _DEFAULT_TRAINING_RANKS.at(-1)) as TrainingRank;
}

// ── Semester helpers ──

export function computeSemesterGPA(sem: ScoreGroupType): { scale10: number | null; scale4: number | null } {
  const subjects = sem.data.filter((s) => !s.isIgnore && s.point.character);
  if (subjects.length === 0) {
    return { scale10: null, scale4: null };
  }

  let cr = 0;
  let s10 = 0;
  let s4 = 0;
  for (const sub of subjects) {
    const c = sub.credit;
    const p = sub.point;
    if (p.scale10 == null || p.scale4 == null) {
      continue;
    }
    s10 += p.scale10 * c;
    s4 += p.scale4 * c;
    cr += c;
  }
  return { scale10: cr > 0 ? +(s10 / cr) : null, scale4: cr > 0 ? +(s4 / cr) : null };
}

export function computeCumulativeGPA(
  data: ScoreGroupType[],
  upToIndex: number,
  trainingSemesters = 0
): { gpa10: number; gpa4: number; avgTraining: number } {
  const slice = data.slice(0, upToIndex + 1);
  const summary = computeSummary(slice, trainingSemesters);
  return {
    gpa10: summary.gpa10,
    gpa4: summary.gpa4,
    avgTraining: summary.avgTrainingPoint
  };
}

// ── Retake credits ──

export function countRetakeCredits(data: ScoreGroupType[]): number {
  let credits = 0;
  for (const sem of data) {
    for (const sub of sem.data) {
      if (sub.isIgnore) {
        continue;
      }
      if (sub.point.character === "F") {
        credits += sub.credit;
      }
    }
  }
  return credits;
}

export function getRetakeRisk(
  retakeCredits: number,
  gpa4: number,
  totalProgramCredits: number,
  retakeRatioLimit: number
): "safe" | "warning" | "danger" {
  if (gpa4 < 3.2) {
    return "safe";
  }
  const maxAllowed = totalProgramCredits * retakeRatioLimit - 0.5;
  if (retakeCredits > maxAllowed) {
    return "danger";
  }
  if (retakeCredits > maxAllowed * 0.8) {
    return "warning";
  }
  return "safe";
}

// ── DRL warnings ──

export function getDrlWarnings(
  data: ScoreGroupType[],
  threshold: number
): {
  lowSemesters: ScoreGroupType[];
  consecutiveCount: number;
  isAtRisk: boolean;
} {
  const lowSemesters = data.filter(
    (s) => s.trainingPoint !== null && s.trainingPoint !== undefined && s.trainingPoint < threshold
  );
  let maxConsecutive = 0;
  let current = 0;
  for (const sem of data) {
    if (sem.trainingPoint !== null && sem.trainingPoint !== undefined && sem.trainingPoint < threshold) {
      current++;
      maxConsecutive = Math.max(maxConsecutive, current);
    } else {
      current = 0;
    }
  }
  return { lowSemesters, consecutiveCount: maxConsecutive, isAtRisk: maxConsecutive >= 2 };
}

// ── Credit limits per semester ──

export function getMaxCreditsForStudent(
  gpa4: number,
  isWarningStudent: boolean,
  defaults: { max: number; min: number; warning: number; summer: number }
): { max: number; min: number } {
  if (isWarningStudent || gpa4 < 2.0) {
    return { max: defaults.warning, min: defaults.min };
  }
  return { max: defaults.max, min: defaults.min };
}
