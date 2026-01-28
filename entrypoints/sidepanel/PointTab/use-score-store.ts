import { create } from "zustand";
import { _CHROME_STORAGE_POINT_KEY, _DEFAULT_SCORE_FILTER } from "@/entrypoints/sidepanel/PointTab/default";
import { PointStorageType, ScoreFilterType, ScoreGroupType } from "@/entrypoints/sidepanel/PointTab/type";

type ScoreState = {
  scores: ScoreGroupType[];
  filter: ScoreFilterType;
  lastUpdate: Date | null;
  setScores: (scores: ScoreGroupType[]) => void;
  setFilter: (filter: ScoreFilterType) => void;
  setLastUpdate: (date: Date | null) => void;
  getData: () => Promise<void>;
  saveData: () => Promise<void>;
};

export const useScoreStore = create<ScoreState>((set, get) => ({
  scores: [],
  filter: _DEFAULT_SCORE_FILTER,
  lastUpdate: null,
  setScores: (scores: ScoreGroupType[]) => set({ scores }),
  setFilter: (filter: ScoreFilterType) => {
    set({ filter });
    get().saveData();
  },
  setLastUpdate: (date: Date | null) => set({ lastUpdate: date }),
  getData: async () => {
    const scoresData = await storage.getItem<PointStorageType>(_CHROME_STORAGE_POINT_KEY);
    if (scoresData) {
      set({
        scores: scoresData.data,
        filter: scoresData.filter,
        lastUpdate: scoresData.updatedAt ? new Date(scoresData.updatedAt) : null
      });
    }
  },
  saveData: async () => {
    const data: PointStorageType = {
      filter: get().filter,
      data: get().scores,
      updatedAt: new Date().toISOString()
    };

    await storage.setItem(_CHROME_STORAGE_POINT_KEY, data);
  }
}));
