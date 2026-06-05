import { create } from "zustand";
import { _CHROME_STORAGE_GLOBAL_LOCAL_KEY, _CHROME_STORAGE_GLOBAL_SYNC_KEY } from "@/constants";
import {
  _DEFAULT_DRL_WARNING_THRESHOLD,
  _DEFAULT_FIXED_POINT,
  _DEFAULT_IGNORE_SUBJECT_DATA,
  _DEFAULT_MAX_CREDITS_PER_SEMESTER,
  _DEFAULT_MAX_CREDITS_SUMMER,
  _DEFAULT_MAX_CREDITS_WARNING,
  _DEFAULT_MIN_CREDITS_PER_SEMESTER,
  _DEFAULT_RETAKE_RATIO_LIMIT,
  _DEFAULT_SITE_URL_MAPPING
} from "@/constants/default";
import { _TAB_CATE } from "@/types";

type GlobalStorageType = {
  tab: _TAB_CATE;
  fixedPoint: number;
  ignoreList: string[];
  siteURLMapping: _SITE_MAPPING;
  retakeRatioLimit: number;
  maxCreditsPerSemester: number;
  minCreditsPerSemester: number;
  maxCreditsWarning: number;
  maxCreditsSummer: number;
  drlWarningThreshold: number;
  matchSubjectByName: boolean;
};

function applySavedGlobalData(savedData: Partial<GlobalStorageType>, set: (state: Partial<GlobalState>) => void) {
  if (savedData.tab) {
    set({ tab: savedData.tab });
  }
  if (savedData.fixedPoint !== undefined) {
    set({ fixedPoint: savedData.fixedPoint });
  }
  if (savedData.ignoreList) {
    set({ ignoreList: savedData.ignoreList });
  }
  if (savedData.retakeRatioLimit !== undefined) {
    set({ retakeRatioLimit: savedData.retakeRatioLimit });
  }
  if (savedData.maxCreditsPerSemester !== undefined) {
    set({ maxCreditsPerSemester: savedData.maxCreditsPerSemester });
  }
  if (savedData.minCreditsPerSemester !== undefined) {
    set({ minCreditsPerSemester: savedData.minCreditsPerSemester });
  }
  if (savedData.maxCreditsWarning !== undefined) {
    set({ maxCreditsWarning: savedData.maxCreditsWarning });
  }
  if (savedData.maxCreditsSummer !== undefined) {
    set({ maxCreditsSummer: savedData.maxCreditsSummer });
  }
  if (savedData.drlWarningThreshold !== undefined) {
    set({ drlWarningThreshold: savedData.drlWarningThreshold });
  }
  if (savedData.matchSubjectByName !== undefined) {
    set({ matchSubjectByName: savedData.matchSubjectByName });
  }
}

type GlobalState = {
  tab: _TAB_CATE;
  siteCurr: _SITE_CATE;
  siteCurrURL: string;
  fixedPoint: number;
  ignoreList: string[];
  siteURLMapping: _SITE_MAPPING;
  retakeRatioLimit: number;
  maxCreditsPerSemester: number;
  minCreditsPerSemester: number;
  maxCreditsWarning: number;
  maxCreditsSummer: number;
  drlWarningThreshold: number;
  matchSubjectByName: boolean;
  setFixedPoint: (point: number) => void;
  setIgnoreList: (list: string[]) => void;
  setSiteURLMapping: (mapping: _SITE_MAPPING) => void;
  setRetakeRatioLimit: (v: number) => void;
  setMaxCreditsPerSemester: (v: number) => void;
  setMinCreditsPerSemester: (v: number) => void;
  setMaxCreditsWarning: (v: number) => void;
  setMaxCreditsSummer: (v: number) => void;
  setDrlWarningThreshold: (v: number) => void;
  setMatchSubjectByName: (v: boolean) => void;
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
  siteURLMapping: _DEFAULT_SITE_URL_MAPPING,
  retakeRatioLimit: _DEFAULT_RETAKE_RATIO_LIMIT,
  maxCreditsPerSemester: _DEFAULT_MAX_CREDITS_PER_SEMESTER,
  minCreditsPerSemester: _DEFAULT_MIN_CREDITS_PER_SEMESTER,
  maxCreditsWarning: _DEFAULT_MAX_CREDITS_WARNING,
  maxCreditsSummer: _DEFAULT_MAX_CREDITS_SUMMER,
  drlWarningThreshold: _DEFAULT_DRL_WARNING_THRESHOLD,
  matchSubjectByName: true,
  setTab: (tab: _TAB_CATE) => {
    set({ tab });
    get().saveData();
  },
  setSiteCurr: (siteCurr: _SITE_CATE) => set({ siteCurr }),
  setSiteCurrURL: (siteCurrURL: string) => set({ siteCurrURL }),
  setFixedPoint: (point: number) => set({ fixedPoint: point }),
  setIgnoreList: (list: string[]) => set({ ignoreList: list }),
  setSiteURLMapping: (mapping: _SITE_MAPPING) => set({ siteURLMapping: mapping }),
  setRetakeRatioLimit: (v: number) => set({ retakeRatioLimit: v }),
  setMaxCreditsPerSemester: (v: number) => set({ maxCreditsPerSemester: v }),
  setMinCreditsPerSemester: (v: number) => set({ minCreditsPerSemester: v }),
  setMaxCreditsWarning: (v: number) => set({ maxCreditsWarning: v }),
  setMaxCreditsSummer: (v: number) => set({ maxCreditsSummer: v }),
  setDrlWarningThreshold: (v: number) => set({ drlWarningThreshold: v }),
  setMatchSubjectByName: (v: boolean) => set({ matchSubjectByName: v }),
  saveData: async () => {
    const data: GlobalStorageType = {
      tab: get().tab,
      fixedPoint: get().fixedPoint,
      ignoreList: get().ignoreList,
      siteURLMapping: get().siteURLMapping,
      retakeRatioLimit: get().retakeRatioLimit,
      maxCreditsPerSemester: get().maxCreditsPerSemester,
      minCreditsPerSemester: get().minCreditsPerSemester,
      maxCreditsWarning: get().maxCreditsWarning,
      maxCreditsSummer: get().maxCreditsSummer,
      drlWarningThreshold: get().drlWarningThreshold,
      matchSubjectByName: get().matchSubjectByName
    };
    const payload = JSON.stringify(data);
    try {
      await storage.setItem(_CHROME_STORAGE_GLOBAL_SYNC_KEY, payload);
    } catch {
      await storage.setItem(_CHROME_STORAGE_GLOBAL_LOCAL_KEY, payload);
    }
  },
  getData: async () => {
    let raw: string | null = null;
    try {
      raw = await storage.getItem<string>(_CHROME_STORAGE_GLOBAL_SYNC_KEY);
    } catch {
      /* sync storage unavailable, fallback to local */
    }
    if (!raw) {
      raw = await storage.getItem<string>(_CHROME_STORAGE_GLOBAL_LOCAL_KEY);
    }
    const savedData = JSON.parse(raw || "{}") as Partial<GlobalStorageType>;
    applySavedGlobalData(savedData, set);

    if (savedData?.siteURLMapping) {
      const merged: _SITE_MAPPING = structuredClone(_DEFAULT_SITE_URL_MAPPING);
      for (const key of Object.keys(savedData.siteURLMapping) as _SITE_CATE[]) {
        const saved = savedData.siteURLMapping[key];
        if (!saved || "homepageRegex" in saved) {
          continue;
        }
        if (merged[key]) {
          merged[key] = { ...merged[key], ...saved };
        }
      }
      set({ siteURLMapping: merged });
    }
  }
}));
