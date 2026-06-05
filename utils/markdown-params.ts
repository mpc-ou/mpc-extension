import { _DEFAULT_ACADEMIC_RANKS, _DEFAULT_POINT_MAPPING, _DEFAULT_TRAINING_RANKS } from "@/constants/default";

/**
 * Replaces {{VAR}} placeholders in markdown with bold-underlined values.
 * Usage: renderMarkdownParams(md, { EXCELLENT_GPA: "3.6", ... })
 */
export function renderMarkdownParams(md: string, params: Record<string, string | number>): string {
  return md.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = params[key];
    if (val === undefined) {
      return `\`{{${key}}}\``;
    }
    return `**__${String(val)}__**`;
  });
}

export type CalcParamsInput = {
  retakeRatioLimit: number;
  maxCreditsPerSemester: number;
  minCreditsPerSemester: number;
  maxCreditsWarning: number;
  maxCreditsSummer: number;
  drlWarningThreshold: number;
  totalProgramCredits: number;
  trainingSemesters: number;
};

/** Builds the {{VAR}} → value map used by MarkdownModal for cach_tinh_toan.md. */
export function buildCalcParams(input: CalcParamsInput): Record<string, string | number> {
  const retakePct = (input.retakeRatioLimit * 100).toFixed(0);
  return {
    EXCELLENT_GPA: _DEFAULT_ACADEMIC_RANKS[0].minGpa4,
    GOOD_GPA: _DEFAULT_ACADEMIC_RANKS[1].minGpa4,
    FAIR_GPA: _DEFAULT_ACADEMIC_RANKS[2].minGpa4,
    AVERAGE_GPA: _DEFAULT_ACADEMIC_RANKS[3].minGpa4,
    EXCELLENT_DRL: _DEFAULT_TRAINING_RANKS[0].minPoint,
    GOOD_DRL: _DEFAULT_TRAINING_RANKS[1].minPoint,
    FAIR_DRL: _DEFAULT_TRAINING_RANKS[2].minPoint,
    AVERAGE_DRL: _DEFAULT_TRAINING_RANKS[3].minPoint,
    LOW_DRL_WARN: _DEFAULT_TRAINING_RANKS[4].minPoint,
    LOW_DRL: _DEFAULT_TRAINING_RANKS[5].minPoint,
    WARNING_SCORE: input.drlWarningThreshold,
    RETAKE_RATIO_LIMIT: `${retakePct}%`,
    MAX_CREDITS_PER_SEMESTER: input.maxCreditsPerSemester,
    MIN_CREDITS_PER_SEMESTER: input.minCreditsPerSemester,
    MAX_CREDITS_WARNING: input.maxCreditsWarning,
    MAX_CREDITS_SUMMER: input.maxCreditsSummer,
    TOTAL_PROGRAM_CREDITS: input.totalProgramCredits,
    TRAINING_SEMESTERS: input.trainingSemesters,
    POINT_A_PLUS: _DEFAULT_POINT_MAPPING[0].minScale10,
    POINT_A: _DEFAULT_POINT_MAPPING[1].minScale10,
    POINT_B_PLUS: _DEFAULT_POINT_MAPPING[2].minScale10,
    POINT_B: _DEFAULT_POINT_MAPPING[3].minScale10,
    POINT_C_PLUS: _DEFAULT_POINT_MAPPING[4].minScale10,
    POINT_C: _DEFAULT_POINT_MAPPING[5].minScale10,
    POINT_D_PLUS: _DEFAULT_POINT_MAPPING[6].minScale10,
    POINT_D: _DEFAULT_POINT_MAPPING[7].minScale10
  };
}
