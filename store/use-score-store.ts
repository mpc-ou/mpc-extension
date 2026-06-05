import { create } from "zustand";
import { _DEFAULT_SCORE_FILTER } from "@/constants/default";
import { _CHROME_STORAGE_POINT_KEY, getPointKey } from "@/constants/storage";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import { PointStorageType, ScoreFilterType, ScoreGroupType } from "@/types";
import { computeScoreHash } from "@/utils/hash";

type ScoreState = {
  scores: ScoreGroupType[];
  originalScores: ScoreGroupType[];
  filter: ScoreFilterType;
  lastUpdate: Date | null;
  savedScoresHash: string;
  setScores: (scores: ScoreGroupType[]) => void;
  setOriginalScores: (scores: ScoreGroupType[]) => void;
  setFilter: (filter: ScoreFilterType) => void;
  setLastUpdate: (date: Date | null) => void;
  getData: () => Promise<void>;
  saveData: (studentId?: string) => Promise<void>;
  clearData: () => Promise<void>;
  setupWatcher: () => (() => void) | undefined;
};

export const useScoreStore = create<ScoreState>((set, get) => ({
  scores: [],
  originalScores: [],
  filter: _DEFAULT_SCORE_FILTER,
  lastUpdate: null,
  savedScoresHash: "",
  setScores: (scores: ScoreGroupType[]) => set({ scores }),
  setOriginalScores: (originalScores: ScoreGroupType[]) => set({ originalScores }),
  setFilter: (filter: ScoreFilterType) => {
    set({ filter });
    get().saveData();
  },
  setLastUpdate: (date: Date | null) => set({ lastUpdate: date }),
  getData: async () => {
    const sid = useCurrentUserStore.getState().effectiveStudentId;
    if (!sid) {
      return;
    }
    const key = getPointKey(sid);
    let scoresData: unknown = await storage.getItem(key);
    if (typeof scoresData === "string") {
      try {
        scoresData = JSON.parse(scoresData);
      } catch (e) {
        console.error("Failed to parse scoresData", e);
      }
    }
    if (scoresData) {
      const parsedData = scoresData as PointStorageType;
      const loadedScores = parsedData.data || [];
      set({
        scores: loadedScores,
        originalScores: parsedData.originalData || loadedScores,
        filter: parsedData.filter || get().filter,
        lastUpdate: parsedData.updatedAt ? new Date(parsedData.updatedAt) : null,
        savedScoresHash: computeScoreHash(loadedScores)
      });
    }
  },
  saveData: async (studentId?: string) => {
    const gsid = useCurrentUserStore.getState();
    const sid = studentId || gsid.studentId;
    const allScores = get().scores;
    const key = getPointKey(sid);
    const data: PointStorageType = {
      filter: get().filter,
      data: allScores,
      originalData: get().originalScores,
      updatedAt: new Date().toISOString()
    };

    await storage.setItem(key, data);
    set({ savedScoresHash: computeScoreHash(allScores) });
  },
  clearData: async () => {
    const key = getPointKey(useCurrentUserStore.getState().effectiveStudentId);
    await storage.removeItem(key);
    set({
      scores: [],
      originalScores: [],
      filter: _DEFAULT_SCORE_FILTER,
      lastUpdate: null,
      savedScoresHash: ""
    });
  },
  setupWatcher: () => {
    let unwatch: (() => void) | undefined;
    try {
      unwatch = storage.watch<unknown>(_CHROME_STORAGE_POINT_KEY, (newValue) => {
        if (newValue) {
          let scoresData = newValue;
          if (typeof scoresData === "string") {
            try {
              scoresData = JSON.parse(scoresData);
            } catch (e) {
              console.error("Failed to parse scoresData", e);
            }
          }
          const parsedData = scoresData as PointStorageType;
          const loadedScores = parsedData.data || [];
          set({
            scores: loadedScores,
            originalScores: parsedData.originalData || loadedScores,
            filter: parsedData.filter || get().filter,
            lastUpdate: parsedData.updatedAt ? new Date(parsedData.updatedAt) : null,
            savedScoresHash: computeScoreHash(loadedScores)
          });
        }
      });
    } catch (e) {
      console.error("Failed to setup storage watcher", e);
    }
    return unwatch;
  }
}));
