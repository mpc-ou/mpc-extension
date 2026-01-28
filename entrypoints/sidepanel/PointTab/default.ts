import { ScoreFilterType, ScoreSummaryType } from "@/entrypoints/sidepanel/PointTab/type";

const _CHROME_STORAGE_TYPE: _CHROME_STORAGE_CATE = "local";
const _CHROME_STORAGE_NAME = "pointData" as const;
export const _CHROME_STORAGE_POINT_KEY = `${_CHROME_STORAGE_TYPE}:${_CHROME_STORAGE_NAME}` as const;

export const _DEFAULT_SCORE_SUMMARY: ScoreSummaryType = { semesterCount: 0, totalCredit: 0, gpa10: 0, gpa4: 0 };
export const _DEFAULT_SCORE_FILTER: ScoreFilterType = {
  queryText: "",
  isOnlyCalcGPA: false
};

export const _DEFAULT_FORM_DATA = {
  code: "",
  name: "",
  credit: "",
  scale10: ""
};
