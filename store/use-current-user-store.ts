import { create } from "zustand";
import { _CHROME_STORAGE_CURRENT_USER_KEY, getAvatarKey } from "@/constants/storage";

type CurrentUserState = {
  studentId: string;
  displayName: string;
  avatar: string;
  viewStudentId: string;
  effectiveStudentId: string;
  setCurrentUser: (studentId: string, displayName: string, avatar: string) => void;
  clearCurrentUser: () => void;
  setViewStudentId: (id: string) => void;
  load: () => Promise<void>;
};

export const useCurrentUserStore = create<CurrentUserState>((set, get) => ({
  studentId: "",
  displayName: "",
  avatar: "",
  viewStudentId: "",
  effectiveStudentId: "",
  setCurrentUser: (studentId: string, displayName: string, avatar: string) => {
    set({ studentId, displayName, avatar, viewStudentId: "", effectiveStudentId: studentId });
    storage.setItem(_CHROME_STORAGE_CURRENT_USER_KEY, JSON.stringify({ studentId, displayName }));
    if (avatar) {
      storage.setItem(getAvatarKey(studentId), avatar);
    }
  },
  clearCurrentUser: () => {
    set({ studentId: "", displayName: "", avatar: "", viewStudentId: "", effectiveStudentId: "" });
    storage.setItem(_CHROME_STORAGE_CURRENT_USER_KEY, "{}");
  },
  setViewStudentId: (id: string) => {
    const sid = id || get().studentId;
    set({ viewStudentId: id, effectiveStudentId: sid });
  },
  load: async () => {
    try {
      const raw = await storage.getItem(_CHROME_STORAGE_CURRENT_USER_KEY);
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        if (parsed.studentId) {
          let avatar = "";
          try {
            avatar = (await storage.getItem<string>(getAvatarKey(parsed.studentId))) || "";
          } catch {
            /* ignore */
          }
          set({
            studentId: parsed.studentId,
            displayName: parsed.displayName || "",
            avatar,
            effectiveStudentId: parsed.studentId
          });
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
  }
}));
