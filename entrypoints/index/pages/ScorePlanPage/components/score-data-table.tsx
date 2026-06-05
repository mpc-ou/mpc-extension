import { ArrowUpDown, EditIcon, MoreVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useId, useState } from "react";
import subjectsData from "@/assets/data/subject.json";
import { Combobox } from "@/components/custom/combobox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { _DEFAULT_FORM_DATA, _GRADE_TOOLTIP } from "@/constants/default";
import { cn } from "@/lib/utils";
import type { ScoreGroupType, ScoreRecordType } from "@/types";
import { formatFixed, parseScale10ToCharacterAndScale4, removeVietnameseTones } from "@/utils";
import { computeSummary, getAcademicRank, getTrainingRank } from "@/utils/academic-compute";

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
  handleDeleteSemester
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSemesterIdx, setSelectedSemesterIdx] = useState(0);
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0);
  const [deletingSemesterIdx, setDeletingSemesterIdx] = useState<number | null>(null);
  const [formData, setFormData] = useState(_DEFAULT_FORM_DATA);

  const idCode = useId();
  const idName = useId();
  const idCredit = useId();
  const idScale10 = useId();

  const subjectOptions = subjectsData.map((s) => ({
    value: `${s.code}|${s.name}|${s.credit}`,
    label: `${s.code} - ${s.name} (${s.credit} TC)`
  }));

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

  const handleSubjectSelect = (val: string) => {
    if (val) {
      const [code, name, credit] = val.split("|");
      setFormData({ ...formData, code, name, credit });
    }
  };

  const handleOpenAdd = (semIdx: number) => {
    setSelectedSemesterIdx(semIdx);
    setIsEditMode(false);
    setFormData({ code: "", name: "", credit: "", scale10: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (semIdx: number, subIdx: number, sub: ScoreRecordType) => {
    setSelectedSemesterIdx(semIdx);
    setSelectedSubjectIdx(subIdx);
    setIsEditMode(true);
    setFormData({
      code: sub.code,
      name: sub.name,
      credit: sub.credit?.toString() || "",
      scale10: sub.point.scale10?.toString() || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const s10 = Number(formData.scale10);
    const { scale4, character } = parseScale10ToCharacterAndScale4(s10);
    const subjectData = {
      code: formData.code,
      name: formData.name,
      credit: Number(formData.credit),
      point: { scale10: s10, scale4, character }
    };
    if (isEditMode) {
      handleEditSubject(selectedSemesterIdx, selectedSubjectIdx, subjectData);
    } else {
      handleAddSubject(selectedSemesterIdx, subjectData);
    }
    setDialogOpen(false);
  };

  const isFormValid = formData.code && formData.name && formData.credit && formData.scale10;

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
                <span className='rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground'>Được cải thiện</span>
              )}
              {sub.isImproved && !sub.isIgnore && (
                <span className='rounded bg-primary/15 px-1.5 py-0.5 font-medium text-[10px] text-primary'>
                  Cải thiện
                </span>
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
                    return _GRADE_TOOLTIP.Đ;
                  }
                  return _GRADE_TOOLTIP[sub.point.character] ?? `Xếp loại: ${sub.point.character}`;
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
        {renderSubjectDialog()}
      </div>
    );
  }

  function renderSubjectDialog() {
    return (
      <>
        <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
          <DialogContent className='sm:max-w-150'>
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Chỉnh sửa môn học" : "Thêm môn học"}</DialogTitle>
              <DialogDescription>
                {isEditMode ? "Cập nhật thông tin." : "Nhập thông tin môn học mới."}
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label className='text-right'>Chọn môn học</Label>
                <div className='col-span-3'>
                  <Combobox
                    emptyText='Không tìm thấy'
                    onValueChange={handleSubjectSelect}
                    options={subjectOptions}
                    placeholder='Chọn từ danh sách...'
                    searchPlaceholder='Tìm kiếm...'
                  />
                </div>
              </div>
              <Separator />
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label className='text-right' htmlFor={idCode}>
                  Mã môn
                </Label>
                <Input
                  className='col-span-3'
                  id={idCode}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  value={formData.code}
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label className='text-right' htmlFor={idName}>
                  Tên môn
                </Label>
                <Input
                  className='col-span-3'
                  id={idName}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  value={formData.name}
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label className='text-right' htmlFor={idCredit}>
                  Tín chỉ
                </Label>
                <Input
                  className='col-span-3'
                  id={idCredit}
                  max='6'
                  min='1'
                  onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                  type='number'
                  value={formData.credit}
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label className='text-right' htmlFor={idScale10}>
                  Điểm hệ 10
                </Label>
                <Input
                  className='col-span-3'
                  id={idScale10}
                  max='10'
                  min='0'
                  onChange={(e) => {
                    const v = Number.parseFloat(e.target.value);
                    if (e.target.value === "" || Number.isNaN(v)) {
                      setFormData({ ...formData, scale10: "" });
                    } else {
                      setFormData({ ...formData, scale10: String(Math.min(10, Math.max(0, v))) });
                    }
                  }}
                  step='0.1'
                  type='number'
                  value={formData.scale10}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setDialogOpen(false)} variant='outline'>
                Hủy
              </Button>
              <Button disabled={!isFormValid} onClick={handleSubmit}>
                {isEditMode ? "Cập nhật" : "Thêm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
      </>
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
      {renderSubjectDialog()}
    </div>
  );
}
