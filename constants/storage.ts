const _LOCAL = "local";
const _SYNC = "sync";

const _key = (prefix: string, studentId: string, suffix: string) =>
  studentId ? `${prefix}:${studentId}:${suffix}` : `${prefix}:${suffix}`;

export const _SYNC_GLOBAL_KEY = `${_SYNC}:global` as const;

export const _CHROME_STORAGE_INFO_KEY = `${_LOCAL}:userData` as const;
export const _CHROME_STORAGE_POINT_KEY = `${_LOCAL}:pointData` as const;
export const _CHROME_STORAGE_CALENDAR_KEY = `${_LOCAL}:studyCalendarData` as const;
export const _CHROME_STORAGE_EXAM_KEY = `${_LOCAL}:examCalendarData` as const;

export const _DATA_SUFFIXES = [
  "userData",
  "pointData",
  "studyCalendarData",
  "examCalendarData",
  "tuitionData",
  "userSettings"
] as const;

export const getScopedKey = (studentId: string, suffix: string) =>
  _key(_LOCAL, studentId, suffix) as `${typeof _LOCAL}:${string}`;

export const getStudentKeys = (studentId: string): string[] => _DATA_SUFFIXES.map((s) => getScopedKey(studentId, s));

export const getAvatarKey = (studentId: string) => _key(_LOCAL, studentId, "avatar") as `${typeof _LOCAL}:${string}`;

export const getUserInfoKey = (studentId: string) => getScopedKey(studentId, "userData");
export const getPointKey = (studentId: string) => getScopedKey(studentId, "pointData");
export const getStudyCalendarKey = (studentId: string) => getScopedKey(studentId, "studyCalendarData");
export const getExamCalendarKey = (studentId: string) => getScopedKey(studentId, "examCalendarData");
export const getTuitionKey = (studentId: string) => getScopedKey(studentId, "tuitionData");
export const getUserSettingsKey = (studentId: string) => getScopedKey(studentId, "userSettings");
