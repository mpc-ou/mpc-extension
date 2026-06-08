export const _LOCAL = "local" as const;
export const _SYNC = "sync" as const;

const _USER_DATA = "userData" as const;
const _POINT_DATA = "pointData" as const;
const _STUDY_CALENDAR_DATA = "studyCalendarData" as const;
const _EXAM_CALENDAR_DATA = "examCalendarData" as const;
const _TUITION_DATA = "tuitionData" as const;
const _USER_SETTINGS = "userSettings" as const;
const _AVATAR_KEY = "avatar" as const;
const _CURRENT_USER = "currentUser" as const;

export const _CHROME_STORAGE_SYNC_GLOBAL_KEY = `${_SYNC}:global` as const;
export const _CHROME_STORAGE_LOCAL_GLOBAL_KEY = `${_LOCAL}:global` as const;

export const _CHROME_STORAGE_INFO_KEY = `${_LOCAL}:${_USER_DATA}` as const;
export const _CHROME_STORAGE_POINT_KEY = `${_LOCAL}:${_POINT_DATA}` as const;
export const _CHROME_STORAGE_CALENDAR_KEY = `${_LOCAL}:${_STUDY_CALENDAR_DATA}` as const;
export const _CHROME_STORAGE_EXAM_KEY = `${_LOCAL}:${_EXAM_CALENDAR_DATA}` as const;
export const _CHROME_STORAGE_CURRENT_USER_KEY = `${_LOCAL}:${_CURRENT_USER}` as const;

export const _DATA_SUFFIXES = [
  _USER_DATA,
  _POINT_DATA,
  _STUDY_CALENDAR_DATA,
  _EXAM_CALENDAR_DATA,
  _TUITION_DATA,
  _USER_SETTINGS
] as const;

const _key = (prefix: _CHROME_STORAGE_CATE, studentId: string, suffix: string): `${_CHROME_STORAGE_CATE}:${string}` =>
  studentId ? `${prefix}:${studentId}:${suffix}` : `${prefix}:${suffix}`;

export const getScopedKey = (studentId: string, suffix: string) =>
  _key(_LOCAL, studentId, suffix) as `${typeof _LOCAL}:${string}`;

export const getStudentKeys = (studentId: string) => _DATA_SUFFIXES.map((s) => getScopedKey(studentId, s));

export const getAvatarKey = (studentId: string) => _key(_LOCAL, studentId, _AVATAR_KEY) as `${typeof _LOCAL}:${string}`;

export const getUserInfoKey = (studentId: string) => getScopedKey(studentId, _USER_DATA);
export const getPointKey = (studentId: string) => getScopedKey(studentId, _POINT_DATA);
export const getStudyCalendarKey = (studentId: string) => getScopedKey(studentId, _STUDY_CALENDAR_DATA);
export const getExamCalendarKey = (studentId: string) => getScopedKey(studentId, _EXAM_CALENDAR_DATA);
export const getTuitionKey = (studentId: string) => getScopedKey(studentId, _TUITION_DATA);
export const getUserSettingsKey = (studentId: string) => getScopedKey(studentId, _USER_SETTINGS);
