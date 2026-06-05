import { create } from "zustand";
import { getExamCalendarKey, getStudyCalendarKey } from "@/constants/storage";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import type { CalendarEntry, CalendarStorageType, SemesterData } from "@/types";
import { buildScheduleMap } from "@/utils/calendar-format";

type CalendarState = {
  studyCalendarData: SemesterData[];
  examCalendarData: SemesterData[];
  lastUpdate: Date | null;
  scheduleMap: Map<string, CalendarEntry[]>;
  setStudyCalendarData: (data: SemesterData[]) => void;
  setExamCalendarData: (data: SemesterData[]) => void;
  setLastUpdate: (date: Date | null) => void;
  getData: () => Promise<void>;
  saveData: (studentId?: string) => Promise<void>;
  clearData: () => Promise<void>;
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  studyCalendarData: [],
  examCalendarData: [],
  lastUpdate: null,
  scheduleMap: new Map(),

  setStudyCalendarData: (data: SemesterData[]) => {
    const map = buildScheduleMap([...data, ...get().examCalendarData]);
    set({ studyCalendarData: data, scheduleMap: map });
  },

  setExamCalendarData: (data: SemesterData[]) => {
    const map = buildScheduleMap([...get().studyCalendarData, ...data]);
    set({ examCalendarData: data, scheduleMap: map });
  },

  setLastUpdate: (date: Date | null) => set({ lastUpdate: date }),

  getData: async () => {
    try {
      const studentId = useCurrentUserStore.getState().effectiveStudentId;
      if (!studentId) {
        return;
      }
      const [storageData, examStorageData] = await Promise.all([
        storage.getItem<CalendarStorageType>(getStudyCalendarKey(studentId)),
        storage.getItem<CalendarStorageType>(getExamCalendarKey(studentId))
      ]);

      const studyCalendarData = storageData?.data || [];
      const examCalendarData = examStorageData?.data || [];
      const map = buildScheduleMap([...studyCalendarData, ...examCalendarData]);

      const updated1 = storageData?.updatedAt ? new Date(storageData.updatedAt).getTime() : 0;
      const updated2 = examStorageData?.updatedAt ? new Date(examStorageData.updatedAt).getTime() : 0;
      const maxUpdate = Math.max(updated1, updated2);

      set({
        studyCalendarData,
        examCalendarData,
        lastUpdate: maxUpdate > 0 ? new Date(maxUpdate) : null,
        scheduleMap: map
      });
    } catch (error) {
      console.error("[Calendar Store] Error loading data:", error);
    }
  },

  saveData: async (studentIdParam?: string) => {
    try {
      const studentId = studentIdParam || useCurrentUserStore.getState().effectiveStudentId;
      const updatedAt = new Date().toISOString();
      const data: CalendarStorageType = { data: get().studyCalendarData, updatedAt };
      const examData: CalendarStorageType = { data: get().examCalendarData, updatedAt };

      await Promise.all([
        storage.setItem(getStudyCalendarKey(studentId), data),
        storage.setItem(getExamCalendarKey(studentId), examData)
      ]);

      set({ lastUpdate: new Date() });
    } catch (error) {
      console.error("[Calendar Store] Error saving data:", error);
    }
  },

  clearData: async () => {
    try {
      const studentId = useCurrentUserStore.getState().effectiveStudentId;
      await Promise.all([
        storage.removeItem(getStudyCalendarKey(studentId)),
        storage.removeItem(getExamCalendarKey(studentId))
      ]);
      set({ studyCalendarData: [], examCalendarData: [], lastUpdate: null, scheduleMap: new Map() });
    } catch (error) {
      console.error("[Calendar Store] Error clearing data:", error);
    }
  }
}));
