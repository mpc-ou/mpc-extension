import { create } from "zustand";
import {
  _CHROME_STORAGE_INFO_KEY,
  _DEFAULT_COURSE_DATA,
  _DEFAULT_USER_DATA
} from "@/entrypoints/sidepanel/InfoTab/default";
import { CourseType, UserType } from "@/entrypoints/sidepanel/InfoTab/type";

type InfoStorageType = {
  userData: UserType;
  courseData: CourseType;
  updatedAt: string;
};

type InfoState = {
  userData: UserType;
  courseData: CourseType;
  lastUpdate: Date | null;
  setUserData: (userData: UserType) => void;
  setCourseData: (courseData: CourseType) => void;
  setLastUpdate: (date: Date | null) => void;
  getData: () => Promise<void>;
  saveData: () => Promise<void>;
};

export const useInfoStore = create<InfoState>((set, get) => ({
  userData: _DEFAULT_USER_DATA,
  courseData: _DEFAULT_COURSE_DATA,
  lastUpdate: null,

  setUserData: (userData: UserType) => set({ userData }),
  setCourseData: (courseData: CourseType) => set({ courseData }),
  setLastUpdate: (date: Date | null) => set({ lastUpdate: date }),

  getData: async () => {
    const savedData = JSON.parse((await storage.getItem(_CHROME_STORAGE_INFO_KEY)) || "{}");

    if (savedData?.userData) {
      set({ userData: savedData.userData });
    }
    if (savedData?.courseData) {
      set({ courseData: savedData.courseData });
    }
    if (savedData?.updatedAt) {
      set({ lastUpdate: new Date(savedData.updatedAt) });
    }
  },

  saveData: async () => {
    const data: InfoStorageType = {
      userData: get().userData,
      courseData: get().courseData,
      updatedAt: new Date().toISOString()
    };

    await storage.setItem(_CHROME_STORAGE_INFO_KEY, JSON.stringify(data));
    set({ lastUpdate: new Date() });
  }
}));
