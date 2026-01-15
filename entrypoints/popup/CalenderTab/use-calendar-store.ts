import { create } from "zustand";
import type { CalendarEntry, CalendarStorageType, SemesterData } from "./type";
import { buildScheduleMap } from "./utils/format";

const STORAGE_KEY = "calendar_data";

type CalendarState = {
  calendarData: SemesterData[] | null;
  lastUpdate: Date | null;
  scheduleMap: Map<string, CalendarEntry[]>;
  setCalendarData: (data: SemesterData[]) => void;
  setLastUpdate: (date: Date | null) => void;
  getData: () => Promise<void>;
  saveData: () => Promise<void>;
  clearData: () => Promise<void>;
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  calendarData: null,
  lastUpdate: null,
  scheduleMap: new Map(),

  setCalendarData: (data: SemesterData[]) => {
    const map = buildScheduleMap(data);
    set({ calendarData: data, scheduleMap: map });
  },

  setLastUpdate: (date: Date | null) => set({ lastUpdate: date }),

  getData: async () => {
    try {
      const result = await browser.storage.local.get(STORAGE_KEY);
      if (result[STORAGE_KEY]) {
        const storageData = result[STORAGE_KEY] as CalendarStorageType;
        const map = buildScheduleMap(storageData.data);
        set({
          calendarData: storageData.data,
          lastUpdate: storageData.updatedAt ? new Date(storageData.updatedAt) : null,
          scheduleMap: map
        });
      }
    } catch (error) {
      console.error("[Calendar Store] Error loading data:", error);
    }
  },

  saveData: async () => {
    try {
      const data: CalendarStorageType = {
        data: get().calendarData || [],
        updatedAt: new Date().toISOString()
      };
      await browser.storage.local.set({ [STORAGE_KEY]: data });
      set({ lastUpdate: new Date() });
    } catch (error) {
      console.error("[Calendar Store] Error saving data:", error);
    }
  },

  clearData: async () => {
    try {
      await browser.storage.local.remove(STORAGE_KEY);
      set({ calendarData: null, lastUpdate: null, scheduleMap: new Map() });
    } catch (error) {
      console.error("[Calendar Store] Error clearing data:", error);
    }
  }
}));
