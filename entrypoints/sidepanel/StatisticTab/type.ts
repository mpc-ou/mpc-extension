import { PointCharacterType } from "@/entrypoints/sidepanel/PointTab/type";

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
