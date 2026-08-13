import { CircleHelp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import CachTinhToanMd from "@/assets/docs/cach_tinh_toan.md?raw";
import HuongDanNhapDiemMd from "@/assets/docs/ke_hoach_diem_so.md?raw";
import { FormSemesterDialog } from "@/components/custom/form-semester-dialog";
import { MarkdownModal } from "@/components/custom/markdown-modal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { _DEFAULT_SCORE_SUMMARY } from "@/constants/default";
import { useConfirm } from "@/hooks/use-confirm";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import { useGlobalStore } from "@/store/use-global-store";
import { useScoreStore } from "@/store/use-score-store";
import { useUserSettingsStore } from "@/store/use-user-settings-store";
import type { ScoreGroupType, ScoreRecordType, ScoreSummaryType } from "@/types";
import { getDrlWarnings } from "@/utils/academic-compute";
import { computeScoreHash } from "@/utils/hash";
import { buildCalcParams } from "@/utils/markdown-params";
import {
  getNextSemesterName,
  getScoreSummary,
  handleExportScoreData,
  isSameSubject,
  markImprovedSubjects,
  updateIgnoreSubject,
  updateScoreAvg
} from "@/utils/score";
import { FilterModal } from "./components/filter-modal";
import { ImportScoreModal } from "./components/import-score-modal";
import { MascotAdvisor } from "./components/mascot-advisor";
import { ScoreDataTable } from "./components/score-data-table";
import { ScoreEmptyState } from "./components/score-empty-state";
import { type GroupMode, ScoreFiltersBar } from "./components/score-filters-bar";
import { ScoreOverviewCards } from "./components/score-overview-cards";
import { ScoreStickyBar } from "./components/score-sticky-bar";
import { ScoreToolbar } from "./components/score-toolbar";
import { ScoreWarnings } from "./components/score-warnings";

type SemesterDialogState = {
  open: boolean;
  mode: "add" | "edit";
  semesterIdx?: number;
};

function getInitialTrainingPoint(semesterDialog: SemesterDialogState, scores: ScoreGroupType[]) {
  if (semesterDialog.mode === "edit" && semesterDialog.semesterIdx !== undefined) {
    return scores[semesterDialog.semesterIdx]?.trainingPoint ?? null;
  }

  return null;
}

function getInitialSemesterValue(semesterDialog: SemesterDialogState, scores: ScoreGroupType[]) {
  if (semesterDialog.mode === "edit" && semesterDialog.semesterIdx !== undefined) {
    return scores[semesterDialog.semesterIdx]?.title || "";
  }

  return "Học kỳ mới";
}

function ScorePlanPage() {
  const confirm = useConfirm();
  const fixedPoint = useGlobalStore((s) => s.fixedPoint);
  const ignoreList = useGlobalStore((s) => s.ignoreList);
  const drlWarningThreshold = useGlobalStore((s) => s.drlWarningThreshold);
  const retakeRatioLimit = useGlobalStore((s) => s.retakeRatioLimit);
  const maxCreditsPerSemester = useGlobalStore((s) => s.maxCreditsPerSemester);
  const matchSubjectByName = useGlobalStore((s) => s.matchSubjectByName);
  const minCreditsPerSemester = useGlobalStore((s) => s.minCreditsPerSemester);
  const maxCreditsWarning = useGlobalStore((s) => s.maxCreditsWarning);
  const maxCreditsSummer = useGlobalStore((s) => s.maxCreditsSummer);
  const { setScores, scores, originalScores, setOriginalScores, lastUpdate, setLastUpdate, saveData, savedScoresHash } =
    useScoreStore();
  const {
    settings: { trainingSemesters, totalProgramCredits }
  } = useUserSettingsStore();
  const effectiveStudentId = useCurrentUserStore((s) => s.effectiveStudentId);
  const [summary, setSummary] = useState<ScoreSummaryType>(_DEFAULT_SCORE_SUMMARY);
  const [searchText, setSearchText] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("semester");
  const ALL_GRADES = ["F", "D", "D+", "C", "C+", "B", "B+", "A", "A+"] as const;
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set(ALL_GRADES));
  const [filterOpen, setFilterOpen] = useState(false);
  const [semesterDialog, setSemesterDialog] = useState<SemesterDialogState>({ open: false, mode: "add" });
  const [guideImportOpen, setGuideImportOpen] = useState(false);
  const [guideCalcOpen, setGuideCalcOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [hideNonGPA, setHideNonGPA] = useState(false);
  const [showNonStandard, setShowNonStandard] = useState(true);
  const [estimatedTuition, setEstimatedTuition] = useState<number | null>(null);

  const loadEstimatedTuition = useCallback(async () => {
    const sid = useCurrentUserStore.getState().effectiveStudentId;
    if (!sid) {
      return;
    }
    const raw = await storage.getItem<number>(`local:${sid}:latestAvgCreditCost`);
    if (typeof raw === "number" && raw > 0) {
      setEstimatedTuition(raw);
    }
  }, []);

  useEffect(() => {
    loadEstimatedTuition();
  }, [loadEstimatedTuition]);

  useEffect(() => {
    loadEstimatedTuition();
  }, [loadEstimatedTuition]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        loadEstimatedTuition();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadEstimatedTuition]);

  const displayScores = useMemo(() => {
    if (!hideNonGPA) {
      return scores;
    }
    return scores.map((sem) => ({ ...sem, data: sem.data.filter((sub) => !sub.isIgnore) }));
  }, [scores, hideNonGPA]);

  const [originalSummary, setOriginalSummary] = useState<ScoreSummaryType | null>(null);
  const drlWarnings = useMemo(() => getDrlWarnings(scores, drlWarningThreshold), [scores, drlWarningThreshold]);

  useEffect(() => {
    if (originalScores.length > 0) {
      setOriginalSummary(getScoreSummary(originalScores, trainingSemesters));
    } else {
      setOriginalSummary(null);
    }
  }, [originalScores, trainingSemesters]);

  const handleImportSuccess = async (data: ScoreGroupType[]) => {
    // Normalize NaN values from exempt/pass-fail subjects before display
    const normalized = updateIgnoreAndAvg(
      data.map((sem) => ({
        ...sem,
        data: sem.data.map((sub) => ({
          ...sub,
          point: {
            ...sub.point,
            scale10: Number.isNaN(sub.point.scale10) ? 0 : sub.point.scale10,
            scale4: Number.isNaN(sub.point.scale4) ? 0 : sub.point.scale4
          }
        }))
      }))
    );
    setSummary(getScoreSummary(normalized, trainingSemesters));
    useScoreStore.getState().setScores(normalized);
    useScoreStore.getState().setOriginalScores(normalized);
    useScoreStore.getState().setLastUpdate(new Date());
    await useScoreStore.getState().saveData(effectiveStudentId);
    toast.success("Đã nhập dữ liệu điểm thành công!");
  };

  const currentHash = useMemo(() => computeScoreHash(scores), [scores]);
  const hasUnsavedChanges = savedScoresHash !== "" && currentHash !== savedScoresHash;

  const originalHash = useMemo(() => computeScoreHash(originalScores), [originalScores]);
  const isModifiedFromOriginal = savedScoresHash !== "" && originalHash !== "" && savedScoresHash !== originalHash;

  const calcParams = useMemo(
    () =>
      buildCalcParams({
        retakeRatioLimit,
        maxCreditsPerSemester,
        minCreditsPerSemester,
        maxCreditsWarning,
        maxCreditsSummer,
        drlWarningThreshold,
        totalProgramCredits,
        trainingSemesters
      }),
    [
      retakeRatioLimit,
      maxCreditsPerSemester,
      minCreditsPerSemester,
      maxCreditsWarning,
      maxCreditsSummer,
      drlWarningThreshold,
      totalProgramCredits,
      trainingSemesters
    ]
  );

  const investedCredits = useMemo(() => {
    if (!originalScores || originalScores.length === 0) {
      return 0;
    }

    const currentSubs = scores.flatMap((s) => s.data);
    const initSubs = originalScores.flatMap((s) => s.data);

    let invested = 0;
    for (const c of currentSubs) {
      const original = initSubs.find((i) => isSameSubject(i, c, matchSubjectByName));
      if (!original) {
        invested += c.credit;
        continue;
      }
      const origScale10 = original.point.scale10 || 0;
      const currScale10 = c.point.scale10 || 0;
      if (origScale10 > 0 && currScale10 !== origScale10) {
        invested += c.credit;
      }
    }
    return invested;
  }, [scores, originalScores, matchSubjectByName]);

  const handleAutoAddSemester = () => {
    let nextTitle: string | null = null;
    if (scores.length > 0) {
      nextTitle = getNextSemesterName(scores[0].title);
    }

    if (!nextTitle) {
      setSemesterDialog({ open: true, mode: "add" });
      return;
    }

    const newData = [...scores];
    newData.unshift({
      title: nextTitle,
      data: [],
      id: Date.now(),
      totalCredit: 0,
      trainingPoint: null,
      avgPoint: { scale10: null, scale4: null }
    });
    saveCurrentData(newData);
    toast.success("Thêm học kỳ thành công!");
  };

  const updateIgnoreAndAvg = useCallback(
    (data: ScoreGroupType[]) => {
      const updated = updateIgnoreSubject(data, ignoreList);
      return updateScoreAvg(markImprovedSubjects(updated));
    },
    [ignoreList]
  );

  const saveCurrentData = (data: ScoreGroupType[]) => {
    const updatedData = updateIgnoreAndAvg(data);
    setSummary(getScoreSummary(updatedData, trainingSemesters));
    setScores(updatedData);
    setLastUpdate(new Date());
  };

  const handleCancelChanges = async () => {
    await useScoreStore.getState().getData();
    toast.info("Đã hủy các thay đổi chưa lưu");
  };

  const handleSaveChanges = async () => {
    await useScoreStore.getState().saveData(effectiveStudentId);
    await useScoreStore.getState().getData();
    toast.success("Đã lưu kế hoạch điểm!");
  };

  const handleRestoreOriginal = async () => {
    if (originalScores.length > 0) {
      const restored = structuredClone(originalScores);
      const store = useScoreStore.getState();
      store.setScores(restored);
      setSummary(getScoreSummary(restored, trainingSemesters));
      await store.saveData(effectiveStudentId);
      await store.getData();
      toast.success("Đã khôi phục dữ liệu gốc");
    }
  };

  useEffect(() => {
    setSummary(getScoreSummary(scores, trainingSemesters));
  }, [scores, trainingSemesters]);

  const handleImportAuto = () => {
    setGuideImportOpen(true);
  };

  const handleCalcGuide = () => {
    setGuideCalcOpen(true);
  };

  const handleClearData = async () => {
    const isConfirmed = await confirm({
      title: "Xác nhận xóa dữ liệu",
      description: "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu điểm số? Hành động này không thể hoàn tác.",
      confirmText: "Xóa điểm",
      variant: "destructive"
    });

    if (isConfirmed) {
      const { clearData } = useScoreStore.getState();
      await clearData();
      toast.success("Đã xóa dữ liệu điểm số");
    }
  };

  const handleCopyData = () => {
    const json = JSON.stringify({ summary, lastUpdate: lastUpdate?.toISOString(), scores }, null, 2);
    navigator.clipboard
      .writeText(json)
      .then(() => toast.success("Đã sao chép dữ liệu JSON!"))
      .catch(() => toast.error("Không thể sao chép!"));
  };

  const handleDeleteSubject = (semesterIdx: number, subjectIdx: number) => {
    const newData = [...scores];
    newData[semesterIdx].data.splice(subjectIdx, 1);
    saveCurrentData(newData);
  };

  const handleEditSubject = (
    semesterIdx: number,
    subjectIdx: number,
    subject: Omit<ScoreRecordType, "isIgnore" | "isHead">
  ) => {
    const newData = [...scores];
    const existing = newData[semesterIdx].data[subjectIdx];
    newData[semesterIdx].data[subjectIdx] = {
      ...existing,
      ...subject,
      id:
        existing.id ||
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `sub-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`)
    };
    saveCurrentData(newData);
    toast.success("Cập nhật môn học thành công!");
  };

  const handleAddSubject = (semesterIdx: number, subject: Omit<ScoreRecordType, "isIgnore" | "isHead">) => {
    const generateId = () =>
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sub-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
    const newData = [...scores];
    newData[semesterIdx].data.unshift({
      ...subject,
      id: generateId()
    });
    saveCurrentData(newData);
    toast.success("Thêm môn học thành công!");
  };

  const handleLinkImprovement = (newSubId: string, oldSubId: string | null) => {
    const newData = scores.map((sem) => ({
      ...sem,
      data: sem.data.map((sub) => {
        if (sub.id === newSubId) {
          return { ...sub, improvesSubjectId: oldSubId || undefined };
        }
        return sub;
      })
    }));
    saveCurrentData(newData);
    if (oldSubId) {
      toast.success("Đã thiết lập liên kết cải thiện môn học!");
    } else {
      toast.success("Đã hủy liên kết cải thiện!");
    }
  };

  const handleDeleteSemester = (semesterIdx: number) => {
    const newData = [...scores];
    newData.splice(semesterIdx, 1);
    saveCurrentData(newData);
    toast.success("Xóa học kỳ thành công!");
  };

  const handleSemesterSubmit = (name: string, trainingPoint: number | null) => {
    const newData = [...scores];
    if (semesterDialog.mode === "add") {
      newData.unshift({
        title: name,
        data: [],
        id: Date.now(),
        totalCredit: 0,
        trainingPoint,
        avgPoint: { scale10: null, scale4: null }
      });
      toast.success("Thêm học kỳ thành công!");
    } else if (semesterDialog.semesterIdx !== undefined) {
      newData[semesterDialog.semesterIdx].title = name;
      newData[semesterDialog.semesterIdx].trainingPoint = trainingPoint;
      toast.success("Cập nhật học kỳ thành công!");
    }
    saveCurrentData(newData);
    setSemesterDialog({ open: false, mode: "add" });
  };

  if (scores.length === 0) {
    return (
      <ScoreEmptyState
        guideOpen={guideImportOpen}
        importModalOpen={importModalOpen}
        onGuideOpenChange={setGuideImportOpen}
        onImportOpenChange={setImportModalOpen}
        onImportSuccess={handleImportSuccess}
        onOpenImportManual={() => setImportModalOpen(true)}
      />
    );
  }

  return (
    <div className='space-y-6 pb-24'>
      <ScoreOverviewCards
        fixedPoint={fixedPoint}
        investedCredits={investedCredits}
        isModifiedFromOriginal={isModifiedFromOriginal}
        originalSummary={originalSummary}
        summary={summary}
        trainingSemesters={trainingSemesters}
      />

      <ScoreWarnings warnings={drlWarnings} />

      <ScoreToolbar
        lastUpdate={lastUpdate}
        onCalcGuide={handleCalcGuide}
        onClearData={handleClearData}
        onCopyData={handleCopyData}
        onExportData={() => handleExportScoreData(scores)}
        onImportAuto={handleImportAuto}
        onImportManual={() => setImportModalOpen(true)}
      />

      {matchSubjectByName && (
        <div className='flex items-center gap-1.5 text-muted-foreground text-xs'>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='flex cursor-help items-center gap-1'>
                <CircleHelp className='h-3 w-3' />
                So sánh môn cải thiện bằng tên
              </span>
            </TooltipTrigger>
            <TooltipContent className='max-w-56'>
              Đang so sánh môn cải thiện theo tên + tín chỉ (ngoài mã môn). Tắt trong Cài đặt nếu không cần.
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <ScoreFiltersBar
        groupMode={groupMode}
        hideNonGPA={hideNonGPA}
        onAddSemester={handleAutoAddSemester}
        onFilterOpen={() => setFilterOpen(true)}
        onGroupModeChange={setGroupMode}
        onSearchTextChange={setSearchText}
        onToggleHideNonGPA={setHideNonGPA}
        searchText={searchText}
        selectedGrades={selectedGrades}
      />

      <ScoreDataTable
        data={displayScores}
        fixedPoint={fixedPoint}
        groupMode={groupMode}
        handleAddSubject={handleAddSubject}
        handleDeleteSemester={handleDeleteSemester}
        handleDeleteSubject={handleDeleteSubject}
        handleEditSemester={(idx) => setSemesterDialog({ open: true, mode: "edit", semesterIdx: idx })}
        handleEditSubject={handleEditSubject}
        handleLinkImprovement={handleLinkImprovement}
        initialData={originalScores}
        searchText={searchText}
        selectedGrades={selectedGrades}
        showNonStandard={showNonStandard}
      />

      <FormSemesterDialog
        initialTrainingPoint={getInitialTrainingPoint(semesterDialog, scores)}
        initialValue={getInitialSemesterValue(semesterDialog, scores)}
        mode={semesterDialog.mode}
        onOpenChange={(open) => setSemesterDialog({ ...semesterDialog, open })}
        onSubmit={handleSemesterSubmit}
        open={semesterDialog.open}
      />

      <FilterModal
        onFilterChange={setSelectedGrades}
        onOpenChange={setFilterOpen}
        onToggleShowNonStandard={setShowNonStandard}
        open={filterOpen}
        selectedGrades={selectedGrades}
        showNonStandard={showNonStandard}
      />

      <ScoreStickyBar
        estimatedTuition={estimatedTuition}
        fixedPoint={fixedPoint}
        hasUnsavedChanges={hasUnsavedChanges}
        investedCredits={investedCredits}
        isModifiedFromOriginal={isModifiedFromOriginal}
        onCancelChanges={handleCancelChanges}
        onRestoreOriginal={handleRestoreOriginal}
        onSaveChanges={handleSaveChanges}
        originalSummary={originalSummary}
        summary={summary}
      />
      <MascotAdvisor />

      <MarkdownModal
        isOpen={guideImportOpen}
        markdownContent={HuongDanNhapDiemMd}
        onClose={() => setGuideImportOpen(false)}
        params={calcParams}
        title='Hướng dẫn Kế hoạch điểm số'
      />

      <MarkdownModal
        isOpen={guideCalcOpen}
        markdownContent={CachTinhToanMd}
        onClose={() => setGuideCalcOpen(false)}
        params={calcParams}
        title='Cách tính điểm'
      />

      <ImportScoreModal
        onImportSuccess={handleImportSuccess}
        onOpenChange={setImportModalOpen}
        open={importModalOpen}
      />
    </div>
  );
}

export { ScorePlanPage };
