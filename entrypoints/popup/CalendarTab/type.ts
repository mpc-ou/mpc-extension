export type CalendarEntry = {
  category: "COURSE" | "LAB" | "EXAM" | "HOLIDAY" | "LESSON" | "OTHER";
  day: string;
  startPeriod?: number;
  endPeriod?: number;
  startTime: string;
  endTime?: string;
  title: string;
  description?: string;
  code?: string;
  group: string;
  room: string;
  teacher?: string;
};

export type WeekData = {
  week: string;
  schedule: CalendarEntry[];
};

export type SemesterData = {
  semester: string;
  weeks: WeekData[];
};

export type ProgressCallback = (progress: number, message: string) => void;

export type DaySchedule = {
  date: Date;
  schedule: CalendarEntry[];
};

export type CalendarStorageType = {
  data: SemesterData[];
  updatedAt: string;
};
