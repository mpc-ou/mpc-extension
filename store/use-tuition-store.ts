import { create } from "zustand";
import { getScopedKey, getTuitionKey } from "@/constants/storage";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import type { ScholarshipType, SemesterTuitionDetail, TuitionStorageType, TuitionSummaryEntry } from "@/types";

type TuitionState = {
  summary: TuitionSummaryEntry[];
  details: Record<string, SemesterTuitionDetail>;
  scholarships: Record<string, ScholarshipType>;
  lastUpdate: Date | null;
  setData: (summary: TuitionSummaryEntry[], details: Record<string, SemesterTuitionDetail>, studentId?: string) => void;
  setScholarship: (semesterName: string, type: ScholarshipType) => Promise<void>;
  setLastUpdate: (date: Date | null) => void;
  getData: () => Promise<void>;
  saveData: (studentId?: string) => Promise<void>;
  clearData: () => Promise<void>;
};

const getScholarshipKey = (studentId: string) => getScopedKey(studentId, "scholarships");

export const useTuitionStore = create<TuitionState>((set, get) => ({
  summary: [],
  details: {},
  scholarships: {},
  lastUpdate: null,

  setData: (summary: TuitionSummaryEntry[], details: Record<string, SemesterTuitionDetail>, studentId?: string) => {
    set({ summary, details });
    get().saveData(studentId);
  },

  setScholarship: async (semesterName: string, type: ScholarshipType) => {
    const scholarships = { ...get().scholarships };
    if (type === null) {
      delete scholarships[semesterName];
    } else {
      scholarships[semesterName] = type;
    }
    set({ scholarships });

    const sid = useCurrentUserStore.getState().effectiveStudentId;
    if (sid) {
      await storage.setItem(getScholarshipKey(sid), scholarships);
    }
  },

  setLastUpdate: (date: Date | null) => set({ lastUpdate: date }),

  getData: async () => {
    const sid = useCurrentUserStore.getState().effectiveStudentId;
    if (!sid) {
      return;
    }
    const key = getTuitionKey(sid);
    const saved = await storage.getItem<TuitionStorageType>(key);
    if (saved?.summary) {
      set({
        summary: saved.summary,
        details: saved.details || {},
        lastUpdate: saved.updatedAt ? new Date(saved.updatedAt) : null
      });
    }
    try {
      const sch = await storage.getItem<Record<string, ScholarshipType>>(getScholarshipKey(sid));
      if (sch) {
        set({ scholarships: sch });
      }
    } catch {
      /* ignore */
    }
  },

  saveData: async (studentIdParam?: string) => {
    const gsid = useCurrentUserStore.getState();
    const key = getTuitionKey(studentIdParam || gsid.studentId);
    const data: TuitionStorageType = {
      summary: get().summary,
      details: get().details,
      updatedAt: new Date().toISOString()
    };
    await storage.setItem(key, data);
    set({ lastUpdate: new Date() });
  },

  clearData: async () => {
    const sid = useCurrentUserStore.getState().effectiveStudentId;
    const key = getTuitionKey(sid);
    await storage.removeItem(key);
    await storage.removeItem(getScholarshipKey(sid));
    set({ summary: [], details: {}, scholarships: {}, lastUpdate: null });
  }
}));
