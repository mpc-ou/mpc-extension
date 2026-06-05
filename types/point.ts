export type AcademicRankType = {
  label: string;
  emoji: string;
  color: string;
  bg: string;
};

export type TrainingRankType = {
  label: string;
  emoji: string;
  color: string;
  bg: string;
  minPoint: number;
};

export type UserSettingsType = {
  trainingSemesters: number;
  totalProgramCredits: number;
};

export type PointCharacterType = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D+" | "D" | "F" | "M";
export type PointScale4Type = 4 | 3.5 | 3 | 2.5 | 2 | 1.5 | 1 | 0;

export type PointMappingType = {
  minScale10: number;
  scale4: PointScale4Type;
  character: PointCharacterType;
};

export type ScoreRecordType = {
  code: string;
  name: string;
  credit: number;
  point: {
    scale10: number;
    scale4: number;
    character: PointCharacterType;
  };
  isIgnore?: boolean;
  isImproved?: boolean;
  isHead?: boolean;
};

export type ScoreGroupType = {
  id: number;
  title: string;
  data: ScoreRecordType[];
  totalCredit: number;
  trainingPoint: number | null;
  avgPoint: {
    scale10: number | null;
    scale4: number | null;
  };
};

export type ScoreFilterType = {
  queryText: string;
  isOnlyCalcGPA: boolean;
};

export type ScoreSummaryType = {
  totalSubject?: number;
  semesterCount: number;
  totalCredit: number;
  gpa10: number;
  gpa4: number;
  avgTrainingPoint: number;
};

export type PointStorageType = {
  filter: ScoreFilterType;
  data: ScoreGroupType[];
  originalData?: ScoreGroupType[];
  updatedAt: string;
};

export type SemesterAvgType = {
  title: string;
  scale10: number;
  scale4: number;
};

export type StatisticDataType = {
  credit: {
    total: number;
    ignore: number;
    valid: number;
  };
  semester: {
    total: number;
    ignore: number;
    valid: number;
    avg10: number;
    avg4: number;
    data: SemesterAvgType[];
  };
  subject: {
    total: number;
    ignore: number;
    valid: number;
  };
  character: {
    total: number;
    detail: Record<Exclude<PointCharacterType, "M">, number>;
  };
};
