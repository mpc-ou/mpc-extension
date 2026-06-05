export type CalendarEntry = {
  category: "COURSE" | "LAB" | "EXAM" | "HOLIDAY" | "LESSON" | "OTHER";
  eventType?: "STUDY" | "EXAM";
  locationType?: "NB" | "MLA" | "VVT" | "GP" | "LB" | "OTHER";
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
  link?: string;
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

export type PeriodTimeSlot = {
  label: string;
  start: string;
  end: string;
  isBreak?: boolean;
};

export type PeriodSession = {
  sessionName: string;
  slots: PeriodTimeSlot[];
};

export type PeriodTimeTable = {
  groupName: string;
  campuses: string;
  normalSchedule: PeriodSession[];
  labGroupSchedule?: PeriodSession[];
};

export type DaySchedule = {
  date: Date;
  schedule: CalendarEntry[];
};

export type CalendarStorageType = {
  data: SemesterData[];
  updatedAt: string;
};
