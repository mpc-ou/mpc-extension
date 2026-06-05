import { create } from "zustand";
import { _DEFAULT_COURSE_DATA, _DEFAULT_USER_DATA } from "@/constants/default";
import { getUserInfoKey } from "@/constants/storage";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import { CourseType, UserType } from "@/types";

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
  saveData: (studentId?: string) => Promise<void>;
  clearData: () => Promise<void>;
};

export const useInfoStore = create<InfoState>((set, get) => ({
  userData: _DEFAULT_USER_DATA,
  courseData: _DEFAULT_COURSE_DATA,
  lastUpdate: null,

  setUserData: (userData: UserType) => set({ userData }),
  setCourseData: (courseData: CourseType) => set({ courseData }),
  setLastUpdate: (date: Date | null) => set({ lastUpdate: date }),

  getData: async () => {
    const sid = useCurrentUserStore.getState().effectiveStudentId;
    if (!sid) {
      return;
    }
    const key = getUserInfoKey(sid);
    const savedData = await storage.getItem<InfoStorageType>(key);

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

  saveData: async (studentIdParam?: string) => {
    const key = getUserInfoKey(studentIdParam || useCurrentUserStore.getState().effectiveStudentId);
    const data: InfoStorageType = {
      userData: get().userData,
      courseData: get().courseData,
      updatedAt: new Date().toISOString()
    };

    await storage.setItem(key, data);
    set({ lastUpdate: new Date() });
  },

  clearData: async () => {
    const key = getUserInfoKey(useCurrentUserStore.getState().effectiveStudentId);
    await storage.removeItem(key);
    set({ userData: _DEFAULT_USER_DATA, courseData: _DEFAULT_COURSE_DATA, lastUpdate: null });
  }
}));
