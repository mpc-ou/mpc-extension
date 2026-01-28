import { create } from "zustand";
import { _DEFAULT_FIXED_POINT, _DEFAULT_IGNORE_SUBJECT_DATA } from "@/constants/default";
import { _CHROME_STORAGE_GLOBAL_KEY } from "@/entrypoints/sidepanel/default";
import { _TAB_CATE } from "@/entrypoints/sidepanel/type";

type GlobalStorageType = {
  tab: _TAB_CATE;
  fixedPoint: number;
  ignoreList: string[];
};

type GlobalState = {
  tab: _TAB_CATE;
  siteCurr: _SITE_CATE;
  siteCurrURL: string;
  fixedPoint: number;
  ignoreList: string[];
  setFixedPoint: (point: number) => void;
  setIgnoreList: (list: string[]) => void;
  setTab: (tab: _TAB_CATE) => void;
  setSiteCurr: (siteCurr: _SITE_CATE) => void;
  setSiteCurrURL: (siteCurrURL: string) => void;
  saveData: () => Promise<void>;
  getData: () => Promise<void>;
};

export const useGlobalStore = create<GlobalState>((set, get) => ({
  tab: "point",
  siteCurr: "sv",
  siteCurrURL: "",
  fixedPoint: _DEFAULT_FIXED_POINT,
  ignoreList: _DEFAULT_IGNORE_SUBJECT_DATA,
  setTab: (tab: _TAB_CATE) => {
    set({ tab });
    get().saveData();
  },
  setSiteCurr: (siteCurr: _SITE_CATE) => set({ siteCurr }),
  setSiteCurrURL: (siteCurrURL: string) => set({ siteCurrURL }),
  setFixedPoint: (point: number) => set({ fixedPoint: point }),
  setIgnoreList: (list: string[]) => set({ ignoreList: list }),
  saveData: async () => {
    const data: GlobalStorageType = {
      tab: get().tab,
      fixedPoint: get().fixedPoint,
      ignoreList: get().ignoreList
    };
    await storage.setItem(_CHROME_STORAGE_GLOBAL_KEY, JSON.stringify(data));
  },
  getData: async () => {
    const savedData = JSON.parse((await storage.getItem(_CHROME_STORAGE_GLOBAL_KEY)) || "{}");
    if (savedData?.tab) {
      set({ tab: savedData.tab });
    }
    if (savedData?.fixedPoint) {
      set({ fixedPoint: savedData.fixedPoint });
    }
    if (savedData?.ignoreList) {
      set({ ignoreList: savedData.ignoreList });
    }
  }
}));
