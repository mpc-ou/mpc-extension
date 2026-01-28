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
  // chỉ dùng isHead khi crawl
  isHead?: boolean;
};

export type ScoreGroupType = {
  id: number;
  title: string;
  data: ScoreRecordType[];
  totalCredit: number;
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
};

export type PointStorageType = {
  filter: ScoreFilterType;
  data: ScoreGroupType[];
  updatedAt: string;
};
