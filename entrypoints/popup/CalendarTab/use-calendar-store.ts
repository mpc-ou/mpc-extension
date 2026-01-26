import { create } from "zustand";
import { _CHROME_STORAGE_CALENDAR_KEY } from "@/entrypoints/popup/CalendarTab/default";
import type { CalendarEntry, CalendarStorageType, SemesterData } from "./type";
import { buildScheduleMap } from "./utils/format";

type CalendarState = {
  calendarData: SemesterData[];
  lastUpdate: Date | null;
  scheduleMap: Map<string, CalendarEntry[]>;
  setCalendarData: (data: SemesterData[]) => void;
  setLastUpdate: (date: Date | null) => void;
  getData: () => Promise<void>;
  saveData: () => Promise<void>;
  clearData: () => Promise<void>;
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  calendarData: [],
  lastUpdate: null,
  scheduleMap: new Map(),

  setCalendarData: (data: SemesterData[]) => {
    const map = buildScheduleMap(data);
    set({ calendarData: data, scheduleMap: map });
  },

  setLastUpdate: (date: Date | null) => set({ lastUpdate: date }),

  getData: async () => {
    try {
      const storageData = await storage.getItem<CalendarStorageType>(_CHROME_STORAGE_CALENDAR_KEY);
      if (storageData) {
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
        data: get().calendarData,
        updatedAt: new Date().toISOString()
      };
      await storage.setItem(_CHROME_STORAGE_CALENDAR_KEY, data);
      set({ lastUpdate: new Date() });
    } catch (error) {
      console.error("[Calendar Store] Error saving data:", error);
    }
  },

  clearData: async () => {
    try {
      await storage.removeItem(_CHROME_STORAGE_CALENDAR_KEY);
      set({ calendarData: [], lastUpdate: null, scheduleMap: new Map() });
    } catch (error) {
      console.error("[Calendar Store] Error clearing data:", error);
    }
  }
}));
