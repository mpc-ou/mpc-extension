import { ArrowUpDown, EditIcon, GitFork, MoreVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { _DEFAULT_GRADE_TOOLTIP } from "@/constants/default";
import { cn } from "@/lib/utils";
import type { ScoreGroupType, ScoreRecordType } from "@/types";
import { formatFixed, removeVietnameseTones } from "@/utils";
import { computeSummary, getAcademicRank, getTrainingRank } from "@/utils/academic-compute";
import { ImprovementDetailsDialog } from "./improvement-details-dialog";
import { LinkImprovementDialog } from "./link-improvement-dialog";
import { SubjectDialog } from "./subject-dialog";

type SortKey = "code" | "name" | "credit" | "scale10" | "scale4" | "character";
type SortDir = "asc" | "desc";
const STANDARD_GRADES = new Set(["F", "D", "D+", "C", "C+", "B", "B+", "A", "A+"]);

type Props = {
  data: ScoreGroupType[];
  initialData?: ScoreGroupType[] | null;
  fixedPoint: number;
  groupMode: "semester" | "all";
  searchText: string;
  selectedGrades: Set<string>;
  showNonStandard: boolean;
  handleDeleteSubject: (semesterIdx: number, subjectIdx: number) => void;
  handleAddSubject: (semesterIdx: number, subject: Omit<ScoreRecordType, "isIgnore" | "isHead">) => void;
  handleEditSubject: (
    semesterIdx: number,
    subjectIdx: number,
    subject: Omit<ScoreRecordType, "isIgnore" | "isHead">
  ) => void;
  handleEditSemester?: (semesterIdx: number) => void;
  handleDeleteSemester?: (semesterIdx: number) => void;
  handleLinkImprovement?: (newSubId: string, oldSubId: string | null) => void;
};

function sortRecords(
  records: (ScoreRecordType & { _semIdx: number; _subIdx: number })[],
  sortKey: SortKey | null,
  sortDir: SortDir
) {
  if (!sortKey) {
    return records;
  }
  return [...records].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "code":
        cmp = a.code.localeCompare(b.code);
        break;
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "credit":
        cmp = a.credit - b.credit;
        break;
      case "scale10":
        cmp = (a.point.scale10 ?? 0) - (b.point.scale10 ?? 0);
        break;
      case "scale4":
        cmp = (a.point.scale4 ?? 0) - (b.point.scale4 ?? 0);
        break;
      case "character":
        cmp = (a.point.character ?? "").localeCompare(b.point.character ?? "");
        break;
      default:
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });
}

export function ScoreDataTable({
  data,
  initialData,
  fixedPoint,
  groupMode,
  searchText,
  selectedGrades,
  showNonStandard,
  handleDeleteSubject,
  handleAddSubject,
  handleEditSubject,
  handleEditSemester,
  handleDeleteSemester,
  handleLinkImprovement
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSemesterIdx, setSelectedSemesterIdx] = useState(0);
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0);
  const [deletingSemesterIdx, setDeletingSemesterIdx] = useState<number | null>(null);

  const [linkImprovementSubject, setLinkImprovementSubject] = useState<ScoreRecordType | null>(null);
  const [editingSubject, setEditingSubject] = useState<ScoreRecordType | null>(null);
  const [detailImprovementPair, setDetailImprovementPair] = useState<{
    oldSub: ScoreRecordType;
    oldSem: string;
    newSub: ScoreRecordType;
    newSem: string;
  } | null>(null);

  const findManualLinkagePair = (
    sub: ScoreRecordType,
    subSemTitle: string,
    semData: ScoreGroupType[]
  ): { oldSub: ScoreRecordType; oldSem: string; newSub: ScoreRecordType; newSem: string } | null => {
    if (sub.improvesSubjectId) {
      for (const sem of semData) {
        const found = sem.data.find((s) => s.id === sub.improvesSubjectId);
        if (found) {
          return {
            oldSub: found,
            oldSem: sem.title,
            newSub: sub,
            newSem: subSemTitle
          };
        }
      }
    }

    for (const sem of semData) {
      const found = sem.data.find((s) => s.improvesSubjectId === sub.id);
      if (found) {
        return {
          oldSub: sub,
          oldSem: subSemTitle,
          newSub: found,
          newSem: sem.title
        };
      }
    }

    return null;
  };

  const findAutomaticLinkagePair = (
    sub: ScoreRecordType,
    subSemIdx: number,
    subSemTitle: string,
    semData: ScoreGroupType[]
  ): { oldSub: ScoreRecordType; oldSem: string; newSub: ScoreRecordType; newSem: string } | null => {
    for (let i = 0; i < semData.length; i++) {
      const sem = semData[i];
      for (const s of sem.data) {
        if (s.id !== sub.id && s.name === sub.name && s.credit === sub.credit && s.isImproved) {
          if (i < subSemIdx) {
            return {
              oldSub: sub,
              oldSem: subSemTitle,
              newSub: s,
              newSem: sem.title
            };
          }
          return {
            oldSub: s,
            oldSem: sem.title,
            newSub: sub,
            newSem: subSemTitle
          };
        }
      }
    }
    return null;
  };

  const getImprovementPair = (
    sub: ScoreRecordType,
    semData: ScoreGroupType[]
  ): { oldSub: ScoreRecordType; oldSem: string; newSub: ScoreRecordType; newSem: string } | null => {
    let subSemIdx = -1;
    let subSemTitle = "";
    for (let i = 0; i < semData.length; i++) {
      if (semData[i].data.some((s) => s.id === sub.id)) {
        subSemIdx = i;
        subSemTitle = semData[i].title;
        break;
      }
    }
    if (subSemIdx === -1) {
      return null;
    }

    const manual = findManualLinkagePair(sub, subSemTitle, semData);
    if (manual) {
      return manual;
    }

    return findAutomaticLinkagePair(sub, subSemIdx, subSemTitle, semData);
  };

  const handleOpenImprovementDetails = (sub: ScoreRecordType) => {
    const pair = getImprovementPair(sub, data);
    if (pair) {
      setDetailImprovementPair(pair);
    } else {
      toast.error("Không tìm thấy thông tin đối chiếu cải thiện!");
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const matchesFilter = (sub: ScoreRecordType) => {
    const q = removeVietnameseTones(searchText.toLowerCase());
    const nameMatch =
      q === "" || removeVietnameseTones(sub.name.toLowerCase()).includes(q) || sub.code.toLowerCase().includes(q);

    let gradeMatch = showNonStandard;
    if (sub.point.character) {
      if (STANDARD_GRADES.has(sub.point.character)) {
        gradeMatch = selectedGrades.has(sub.point.character);
      } else {
        gradeMatch = showNonStandard;
      }
    }
    return nameMatch && gradeMatch;
  };

  const handleOpenAdd = (semIdx: number) => {
    setSelectedSemesterIdx(semIdx);
    setIsEditMode(false);
    setEditingSubject(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (semIdx: number, subIdx: number, sub: ScoreRecordType) => {
    setSelectedSemesterIdx(semIdx);
    setSelectedSubjectIdx(subIdx);
    setIsEditMode(true);
    setEditingSubject(sub);
    setDialogOpen(true);
  };

  const handleSubjectSubmit = (subjectData: Omit<ScoreRecordType, "isIgnore" | "isHead">) => {
    if (isEditMode) {
      handleEditSubject(selectedSemesterIdx, selectedSubjectIdx, subjectData);
    } else {
      handleAddSubject(selectedSemesterIdx, subjectData);
    }
    setDialogOpen(false);
  };

  const renderSortHeader = (label: string, k: SortKey, className?: string) => {
    const isCenter = className?.includes("text-center");
    return (
      <TableHead
        className={cn("cursor-pointer select-none hover:bg-muted/50", className)}
        onClick={() => toggleSort(k)}
      >
        <div className={cn("flex items-center gap-1", isCenter && "justify-center")}>
          {label}
          <ArrowUpDown className={cn("h-3 w-3", sortKey === k ? "text-foreground" : "text-muted-foreground/40")} />
        </div>
      </TableHead>
    );
  };

  const getSemesterHeaderSummary = (semesterIdx: number) => computeSummary(data.slice(semesterIdx));

  const renderRows = (records: (ScoreRecordType & { _semIdx: number; _subIdx: number })[], showSemesterCol: boolean) =>
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: table rendering logic is inherently complex
    records.map((sub, _i) => {
      let oldSub: ScoreRecordType | undefined;
      if (initialData) {
        const currentSem = data[sub._semIdx];
        if (currentSem) {
          const initSem = initialData.find((s) => (s.id && s.id === currentSem.id) || s.title === currentSem.title);
          if (initSem) {
            oldSub = initSem.data.find((s) => s.code === sub.code && s.name === sub.name);
          }
        }
      }

      const isModified = oldSub && oldSub.point.scale10 !== sub.point.scale10;
      const isNew = initialData && !oldSub;
      const isHighlighted = isModified || isNew;

      const renderDiff = (oldVal: string | number, newVal: string | number) => {
        const displayOld = typeof oldVal === "number" && Number.isNaN(oldVal) ? "-" : oldVal;
        const displayNew = typeof newVal === "number" && Number.isNaN(newVal) ? "-" : newVal;
        if (!isModified || displayOld === displayNew) {
          return <span>{displayNew}</span>;
        }
        return (
          <div className='flex items-center justify-center gap-1.5'>
            <span className='text-muted-foreground text-xs line-through opacity-60'>{displayOld}</span>
            <span className='text-[10px] text-muted-foreground'>➔</span>
            <span className='font-bold text-amber-600 dark:text-amber-400'>{displayNew}</span>
          </div>
        );
      };

      return (
        <TableRow
          className={cn(sub.isIgnore ? "opacity-50" : "", isHighlighted ? "bg-amber-500/10 hover:bg-amber-500/20" : "")}
          key={`${sub._semIdx}-${sub._subIdx}-${sub.code}`}
        >
          {showSemesterCol && (
            <TableCell className='w-37.5 text-muted-foreground text-xs'>{data[sub._semIdx]?.title}</TableCell>
          )}
          <TableCell className='w-30 font-mono text-xs'>{sub.code}</TableCell>
          <TableCell>
            <div className='flex items-center gap-2'>
              <Tooltip>
                <TooltipTrigger className='max-w-60 truncate text-left text-sm xl:max-w-100'>{sub.name}</TooltipTrigger>
                <TooltipContent>{sub.name}</TooltipContent>
              </Tooltip>
              {sub.isImproved && sub.isIgnore && (
                <button
                  className='cursor-pointer rounded border-none bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground outline-none hover:bg-muted/80'
                  onClick={() => handleOpenImprovementDetails(sub)}
                  type='button'
                >
                  Được cải thiện
                </button>
              )}
              {sub.isImproved && !sub.isIgnore && (
                <button
                  className='cursor-pointer rounded border-none bg-primary/15 px-1.5 py-0.5 font-medium text-[10px] text-primary outline-none hover:bg-primary/25'
                  onClick={() => handleOpenImprovementDetails(sub)}
                  type='button'
                >
                  Cải thiện
                </button>
              )}
              {!sub.isImproved && sub.isIgnore && (
                <Tooltip>
                  <TooltipTrigger>
                    <span className='rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground'>Không tính</span>
                  </TooltipTrigger>
                  <TooltipContent>Môn không tính vào GPA (GDTC, GDQP, BHYT...)</TooltipContent>
                </Tooltip>
              )}
              {isNew && (
                <span className='rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 font-medium text-[10px] text-amber-600'>
                  Mới
                </span>
              )}
            </div>
          </TableCell>
          <TableCell className='w-20 text-center'>{sub.credit}</TableCell>
          <TableCell className='w-35 text-center'>
            {isNew ? (
              <span className='font-bold text-amber-600 dark:text-amber-400'>{sub.point.scale10 ?? "-"}</span>
            ) : (
              renderDiff(oldSub?.point.scale10 ?? "-", sub.point.scale10 ?? "-")
            )}
          </TableCell>
          <TableCell className='w-35 text-center'>
            {isNew ? (
              <span className='font-bold text-amber-600 dark:text-amber-400'>{sub.point.scale4 ?? "-"}</span>
            ) : (
              renderDiff(oldSub?.point.scale4 ?? "-", sub.point.scale4 ?? "-")
            )}
          </TableCell>
          <TableCell className='w-35 text-center'>
            <Tooltip>
              <TooltipTrigger asChild>
                {isNew ? (
                  <span className='font-bold text-amber-600 dark:text-amber-400'>{sub.point.character || "-"}</span>
                ) : (
                  renderDiff(oldSub?.point.character ?? "-", sub.point.character ?? "-")
                )}
              </TooltipTrigger>
              <TooltipContent>
                {(() => {
                  if (!sub.point.character) {
                    return "Chưa có điểm / Đang học";
                  }
                  if (sub.point.character === "D" && (sub.point.scale10 === 0 || sub.point.scale4 === 0)) {
                    return _DEFAULT_GRADE_TOOLTIP.Đ;
                  }
                  return _DEFAULT_GRADE_TOOLTIP[sub.point.character] ?? `Xếp loại: ${sub.point.character}`;
                })()}
              </TooltipContent>
            </Tooltip>
          </TableCell>
          <TableCell className='w-25 text-center'>
            <div className='flex items-center justify-center gap-2'>
              {sub.isIgnore || sub.point.character === "M" ? (
                <EditIcon className='h-4 w-4 text-muted-foreground/30' />
              ) : (
                <EditIcon
                  className='h-4 w-4 cursor-pointer text-blue-500 hover:text-blue-700'
                  onClick={() => handleOpenEdit(sub._semIdx, sub._subIdx, sub)}
                />
              )}
              {(() => {
                const showFork = !sub.isIgnore || sub.improvesSubjectId;
                if (!showFork) {
                  return null;
                }
                return (
                  <button
                    className='cursor-pointer border-none bg-transparent p-0 outline-none'
                    onClick={() => {
                      setLinkImprovementSubject(sub);
                    }}
                    title={
                      sub.improvesSubjectId
                        ? "Môn học này đang liên kết cải thiện"
                        : "Thiết lập liên kết cải thiện môn học"
                    }
                    type='button'
                  >
                    <GitFork
                      className={cn(
                        "h-4 w-4",
                        sub.improvesSubjectId
                          ? "text-emerald-500 hover:text-emerald-700"
                          : "text-amber-500 hover:text-amber-700"
                      )}
                    />
                  </button>
                );
              })()}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Trash2Icon className='h-4 w-4 cursor-pointer text-red-500 hover:text-red-700' />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xóa môn học?</AlertDialogTitle>
                    <AlertDialogDescription>Môn "{sub.name}" sẽ bị xóa.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteSubject(sub._semIdx, sub._subIdx)}>
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TableCell>
        </TableRow>
      );
    });

  if (groupMode === "all") {
    let allRecords = data
      .flatMap((sem, semIdx) => sem.data.map((sub, subIdx) => ({ ...sub, _semIdx: semIdx, _subIdx: subIdx })))
      .filter(matchesFilter);
    allRecords = sortRecords(allRecords, sortKey, sortDir);

    return (
      <div className='space-y-4'>
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                {renderSortHeader("Học kỳ", "name", "w-[150px]")}
                {renderSortHeader("Mã môn", "code", "w-[120px]")}
                {renderSortHeader("Tên môn", "name", "max-w-[250px]")}
                {renderSortHeader("TC", "credit", "w-[80px] text-center")}
                {renderSortHeader("Hệ 10", "scale10", "w-[140px] text-center")}
                {renderSortHeader("Hệ 4", "scale4", "w-[140px] text-center")}
                {renderSortHeader("Xếp loại", "character", "w-[140px] text-center")}
                <TableHead className='w-25 text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderRows(allRecords, true)}</TableBody>
          </Table>
        </div>
        <SubjectDialog
          initialData={
            editingSubject
              ? {
                  code: editingSubject.code,
                  name: editingSubject.name,
                  credit: editingSubject.credit?.toString() || "",
                  scale10: editingSubject.point.scale10?.toString() || ""
                }
              : null
          }
          isEditMode={isEditMode}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubjectSubmit}
          open={dialogOpen}
        />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {data.map((semester, semesterIdx) => {
        let records = semester.data
          .map((sub, subIdx) => ({ ...sub, _semIdx: semesterIdx, _subIdx: subIdx }))
          .filter(matchesFilter);
        records = sortRecords(records, sortKey, sortDir);

        return (
          <div className='overflow-hidden rounded-lg border' key={semester.id}>
            <div className='flex items-center justify-between bg-muted/50 px-4 py-2'>
              <div>
                <p className='pb-1 font-semibold text-sm'>{semester.title}</p>
                <p className='text-muted-foreground text-sm'>
                  Hệ 10:{" "}
                  <span className='font-semibold text-foreground'>
                    {semester.avgPoint.scale10 != null ? formatFixed(semester.avgPoint.scale10, fixedPoint) : "---"}
                  </span>{" "}
                  · Hệ 4:{" "}
                  <span className='font-semibold text-foreground'>
                    {semester.avgPoint.scale4 != null ? formatFixed(semester.avgPoint.scale4, fixedPoint) : "---"}
                  </span>
                  {semester.avgPoint.scale4 !== null ? ` (${getAcademicRank(semester.avgPoint.scale4).label})` : ""} ·
                  ĐRL: <span className='font-semibold text-foreground'>{semester.trainingPoint ?? "---"}</span>
                  {semester.trainingPoint !== null && semester.trainingPoint !== undefined
                    ? ` (${getTrainingRank(semester.trainingPoint).label})`
                    : ""}{" "}
                  · Tích lũy:{" "}
                  <span className='font-semibold text-foreground'>
                    {formatFixed(getSemesterHeaderSummary(semesterIdx).gpa4, fixedPoint)}
                  </span>
                  {` (${getAcademicRank(getSemesterHeaderSummary(semesterIdx).gpa4).label})`}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Button onClick={() => handleOpenAdd(semesterIdx)} size='sm' variant='outline'>
                  <PlusIcon className='mr-1 h-4 w-4' />
                  Thêm môn
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size='icon' variant='ghost'>
                      <MoreVerticalIcon className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => handleEditSemester?.(semesterIdx)}>
                        <EditIcon className='mr-2 h-4 w-4 text-blue-500' />
                        Sửa học kỳ
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingSemesterIdx(semesterIdx)}>
                        <Trash2Icon className='mr-2 h-4 w-4 text-red-500' />
                        Xóa học kỳ
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {semester.data.length === 0 ? (
              <p className='py-4 text-center text-muted-foreground text-sm'>Chưa có môn học</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {renderSortHeader("Mã môn", "code", "w-[120px]")}
                    {renderSortHeader("Tên môn", "name")}
                    {renderSortHeader("TC", "credit", "w-[80px] text-center")}
                    {renderSortHeader("Hệ 10", "scale10", "w-[140px] text-center")}
                    {renderSortHeader("Hệ 4", "scale4", "w-[140px] text-center")}
                    {renderSortHeader("Xếp loại", "character", "w-[140px] text-center")}
                    <TableHead className='w-25 text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderRows(records, false)}</TableBody>
              </Table>
            )}
          </div>
        );
      })}
      <SubjectDialog
        initialData={
          editingSubject
            ? {
                code: editingSubject.code,
                name: editingSubject.name,
                credit: editingSubject.credit?.toString() || "",
                scale10: editingSubject.point.scale10?.toString() || ""
              }
            : null
        }
        isEditMode={isEditMode}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubjectSubmit}
        open={dialogOpen}
      />
      <LinkImprovementDialog
        data={data}
        handleLinkImprovement={handleLinkImprovement}
        onOpenChange={(open) => !open && setLinkImprovementSubject(null)}
        open={linkImprovementSubject !== null}
        subject={linkImprovementSubject}
      />
      <ImprovementDetailsDialog
        onOpenChange={(open) => !open && setDetailImprovementPair(null)}
        open={detailImprovementPair !== null}
        pair={detailImprovementPair}
      />
      <AlertDialog onOpenChange={(open) => !open && setDeletingSemesterIdx(null)} open={deletingSemesterIdx !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa học kỳ?</AlertDialogTitle>
            <AlertDialogDescription>
              Học kỳ "{data[deletingSemesterIdx ?? 0]?.title}" sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingSemesterIdx !== null) {
                  handleDeleteSemester?.(deletingSemesterIdx);
                  setDeletingSemesterIdx(null);
                }
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
