import {
  CalendarPlus,
  DownloadIcon,
  FileSpreadsheet,
  FileText,
  ImportIcon,
  InfoIcon,
  LayoutList,
  MonitorIcon,
  Trash2
} from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import lichHocLichThiMd from "@/assets/docs/lich_hoc_lich_thi.md?raw";
import { ExportCalendarDialog } from "@/components/custom/export-calendar-dialog";
import { MarkdownModal } from "@/components/custom/markdown-modal";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "@/hooks/use-confirm";
import { useCalendarStore } from "@/store/use-calendar-store";
import type { CalendarEntry, SemesterData } from "@/types";
import { formatSemesterLabel, normalizeSemesterName, parseSemesterName } from "@/utils/calendar-format";
import { detectExcelType, mergeCalendarData, parseExamExcel, parseStudyExcel } from "@/utils/calendar-import";
import { convertToCSV, convertToExcel } from "@/utils/excel-utils";
import { downloadICS } from "@/utils/ics-utils";
import { MonthViewCalendar } from "./components/month-view-calendar";
import { PeriodTimeView } from "./components/period-time-view";
import { UpcomingEvents } from "./components/upcoming-events";

export function CalendarPage() {
  const {
    studyCalendarData,
    examCalendarData,
    lastUpdate,
    scheduleMap,
    getData,
    clearData,
    setStudyCalendarData,
    setExamCalendarData,
    saveData
  } = useCalendarStore();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [importSemesterOpen, setImportSemesterOpen] = useState(false);
  const [importSemesterName, setImportSemesterName] = useState("");
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  const mergedExportData = useMemo(() => {
    const merged = [...studyCalendarData];
    for (const sem of examCalendarData) {
      const existingSem = merged.find((s) => normalizeSemesterName(s.semester) === normalizeSemesterName(sem.semester));
      if (existingSem) {
        const existingSemCopy = { ...existingSem, weeks: [...existingSem.weeks] };
        for (const week of sem.weeks) {
          const existingWeek = existingSemCopy.weeks.find((w) => w.week === week.week);
          if (existingWeek) {
            existingWeek.schedule = [...existingWeek.schedule, ...week.schedule];
          } else {
            existingSemCopy.weeks.push({ ...week });
          }
        }
        merged[merged.indexOf(existingSem)] = existingSemCopy;
      } else {
        const p = parseSemesterName(sem.semester);
        merged.push({ ...sem, semester: p ? formatSemesterLabel(p) : sem.semester });
      }
    }

    merged.sort((a, b) => {
      const pa = parseSemesterName(a.semester);
      const pb = parseSemesterName(b.semester);
      if (pa && pb) {
        if (pa.startYear !== pb.startYear) {
          return pb.startYear - pa.startYear;
        }
        return pa.num - pb.num;
      }
      return 0;
    });

    return merged;
  }, [studyCalendarData, examCalendarData]);

  useLayoutEffect(() => {
    getData();
  }, [getData]);

  const filteredScheduleMap = useMemo(() => {
    if (filterType === "ALL") {
      return scheduleMap;
    }

    const map = new Map<string, CalendarEntry[]>();
    for (const [date, entries] of scheduleMap.entries()) {
      const filtered = entries.filter((entry) => {
        if (filterType === "STUDY") {
          return entry.eventType === "STUDY" || entry.category === "COURSE" || entry.category === "LAB";
        }
        if (filterType === "EXAM") {
          return entry.eventType === "EXAM" || entry.category === "EXAM";
        }
        if (filterType === "OTHER") {
          return entry.category === "OTHER" || entry.category === "HOLIDAY";
        }
        return true;
      });
      if (filtered.length > 0) {
        map.set(date, filtered);
      }
    }
    return map;
  }, [scheduleMap, filterType]);

  const eventCounts = useMemo(() => {
    let total = 0;
    let study = 0;
    let exam = 0;
    for (const entries of filteredScheduleMap.values()) {
      for (const e of entries) {
        total++;
        if (e.eventType === "EXAM" || e.category === "EXAM") {
          exam++;
        } else {
          study++;
        }
      }
    }
    return { total, study, exam };
  }, [filteredScheduleMap]);

  const handleClearConfirm = async () => {
    const isConfirmed = await confirm({
      title: "Xác nhận xóa dữ liệu",
      description: "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu lịch học? Hành động này không thể hoàn tác.",
      confirmText: "Xóa lịch",
      variant: "destructive"
    });

    if (isConfirmed) {
      await clearData();
      toast.success("Đã xóa dữ liệu lịch học");
    }
  };

  const handleExport = (selectedSemesters: SemesterData[]) => {
    try {
      downloadICS(selectedSemesters);
      toast.success(`Đã xuất ${selectedSemesters.length} học kỳ`);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi xuất lịch.");
    }
  };

  const handleExportExcel = () => {
    if (mergedExportData.length === 0) {
      return;
    }
    try {
      convertToExcel(mergedExportData);
      toast.success("Đã xuất Excel");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi khi xuất Excel.");
    }
  };

  const handleExportCSV = () => {
    if (mergedExportData.length === 0) {
      return;
    }
    try {
      convertToCSV(mergedExportData);
      toast.success("Đã xuất CSV");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi khi xuất CSV.");
    }
  };

  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    // Reset input so same file can be re-selected
    e.target.value = "";

    if (!(file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      toast.error("Vui lòng chọn file Excel (.xlsx, .xls)");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const { read, utils } = await import("xlsx");
      const workbook = read(buffer, { type: "array" });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const rows: string[][] = utils.sheet_to_json(ws, { header: 1 });
      const headers = (rows[0] as string[])?.map((h: string) => String(h || "").trim()) || [];
      const type = detectExcelType(headers);

      if (!type) {
        toast.error("Không nhận dạng được định dạng file. Vui lòng kiểm tra lại.");
        return;
      }

      setPendingImportFile(file);

      if (type === "study") {
        setImportSemesterName("");
        setImportSemesterOpen(true);
      } else {
        processExamImport(file);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi đọc file");
    }
  };

  const processExamImport = async (file: File) => {
    try {
      const result = await parseExamExcel(file);
      const existing = [...examCalendarData];
      const { added, replaced } = mergeCalendarData(existing, result.data, "exam");

      const isOverwrite = await confirm({
        title: "Xác nhận nhập lịch thi",
        description: `Tìm thấy <strong>${result.data[0]?.weeks.reduce((s, w) => s + w.schedule.length, 0) || 0} buổi thi</strong> trong học kỳ <strong>${result.data[0]?.semester || ""}</strong>.<br/>Có <strong>${added} mới</strong>${replaced > 0 ? `, <strong>${replaced} cập nhật</strong>` : ""}. Tiếp tục?`,
        confirmText: "Nhập",
        variant: "destructive"
      });
      if (!isOverwrite) {
        return;
      }

      setExamCalendarData(existing);
      await saveData();
      toast.success(`Đã nhập ${added} buổi thi${replaced > 0 ? `, cập nhật ${replaced}` : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi nhập lịch thi");
    }
  };

  const handleStudySemesterConfirm = async () => {
    if (!(importSemesterName.trim() && pendingImportFile)) {
      toast.error("Vui lòng nhập tên học kỳ");
      return;
    }

    setImportSemesterOpen(false);

    try {
      const result = await parseStudyExcel(pendingImportFile, importSemesterName.trim());
      const existing = [...studyCalendarData];
      const { added, replaced } = mergeCalendarData(existing, result.data, "study");

      const totalImported = result.data[0]?.weeks.reduce((s, w) => s + w.schedule.length, 0) || 0;

      const isOverwrite = await confirm({
        title: "Xác nhận nhập lịch học",
        description: `Tìm thấy <strong>${totalImported} buổi học</strong> trong học kỳ <strong>${importSemesterName.trim()}</strong>.<br/>Có <strong>${added} mới</strong>${replaced > 0 ? `, <strong>${replaced} cập nhật</strong>` : ""}. Tiếp tục?`,
        confirmText: "Nhập",
        variant: "destructive"
      });
      if (!isOverwrite) {
        return;
      }

      setStudyCalendarData(existing);
      await saveData();
      toast.success(`Đã nhập ${added} buổi học${replaced > 0 ? `, cập nhật ${replaced}` : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi nhập lịch học");
    }
  };

  if (studyCalendarData.length === 0 && examCalendarData.length === 0) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center space-y-4'>
        <div className='mb-4 rounded-full bg-muted p-6'>
          <CalendarPlus className='h-12 w-12 text-muted-foreground' />
        </div>
        <h2 className='font-semibold text-2xl'>Chưa có dữ liệu lịch</h2>
        <p className='mb-6 max-w-md text-center text-muted-foreground'>
          Mở popup extension khi đang ở trang lịch học hoặc lịch thi trên cổng tiện ích sinh viên để nhập dữ liệu.
          <br />
          Hoặc nhập từ file Excel đã xuất trước đó.
        </p>
        <div className='flex gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm'>
                <ImportIcon className='mr-2 h-4 w-4' />
                Nhập lịch
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                <MonitorIcon className='mr-2 h-4 w-4 text-blue-500' />
                Nhập tự động
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportExcel}>
                <DownloadIcon className='mr-2 h-4 w-4 text-green-500' />
                Nhập thủ công
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input accept='.xlsx,.xls' className='hidden' onChange={handleFileChange} ref={fileInputRef} type='file' />
        </div>
        <MarkdownModal
          isOpen={isImportModalOpen}
          markdownContent={lichHocLichThiMd}
          onClose={() => setIsImportModalOpen(false)}
          title='Hướng dẫn nhập lịch'
        />
      </div>
    );
  }

  return (
    <div className='flex h-auto flex-col space-y-4 lg:h-full'>
      <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div className='flex flex-col gap-1'>
          <p className='text-muted-foreground text-sm'>
            Cập nhật lúc:{" "}
            {lastUpdate ? (
              <span className='font-medium text-foreground'>
                {lastUpdate.toLocaleTimeString()} {lastUpdate.toLocaleDateString()}
              </span>
            ) : (
              "Chưa có dữ liệu"
            )}
          </p>
          {eventCounts.total > 0 && (
            <p className='flex items-center gap-1 text-muted-foreground text-xs'>
              <LayoutList className='h-3.5 w-3.5' />
              <span>
                {eventCounts.total} sự kiện
                {` (${eventCounts.study} buổi học${eventCounts.exam > 0 ? `, ${eventCounts.exam} buổi thi` : ""})`}
              </span>
            </p>
          )}
        </div>

        <div className='flex w-full flex-wrap items-center gap-2 md:w-auto'>
          <Select onValueChange={setFilterType} value={filterType}>
            <SelectTrigger className='w-35'>
              <SelectValue placeholder='Loại lịch' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>Tất cả</SelectItem>
              <SelectItem value='STUDY'>Học tập</SelectItem>
              <SelectItem value='EXAM'>Thi cử</SelectItem>
              <SelectItem value='OTHER'>Khác</SelectItem>
            </SelectContent>
          </Select>
          <PeriodTimeView />

          <Button
            className='text-muted-foreground'
            onClick={() => setIsImportModalOpen(true)}
            size='sm'
            variant='ghost'
          >
            <InfoIcon className='mr-2 h-4 w-4' />
            Hướng dẫn
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm'>
                <ImportIcon className='mr-2 h-4 w-4' />
                Nhập lịch
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                <MonitorIcon className='mr-2 h-4 w-4 text-blue-500' />
                Nhập tự động
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportExcel}>
                <DownloadIcon className='mr-2 h-4 w-4 text-green-500' />
                Nhập thủ công
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input accept='.xlsx,.xls' className='hidden' onChange={handleFileChange} ref={fileInputRef} type='file' />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={studyCalendarData.length === 0 && examCalendarData.length === 0} variant='outline'>
                <CalendarPlus className='mr-2 h-4 w-4' />
                Thao tác
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => setIsExportModalOpen(true)}>
                <CalendarPlus className='mr-2 h-4 w-4' />
                Xuất ICS (Lịch)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className='mr-2 h-4 w-4' />
                Xuất Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className='mr-2 h-4 w-4' />
                Xuất CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClearConfirm}>
                <Trash2 className='mr-2 h-4 w-4 text-red-500' />
                Xóa lịch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-6 overflow-y-auto lg:flex-row lg:overflow-hidden'>
        <div className='flex w-full shrink-0 flex-col overflow-hidden rounded-lg border bg-card shadow-sm lg:w-[40%]'>
          <div className='border-b p-4'>
            <h2 className='font-semibold'>Lịch học sắp tới</h2>
          </div>
          <div className='flex-1 p-4'>
            <UpcomingEvents scheduleMap={filteredScheduleMap} />
          </div>
        </div>

        <div className='flex-1 overflow-hidden'>
          <MonthViewCalendar scheduleMap={filteredScheduleMap} />
        </div>
      </div>

      <MarkdownModal
        isOpen={isImportModalOpen}
        markdownContent={lichHocLichThiMd}
        onClose={() => setIsImportModalOpen(false)}
        title='Hướng dẫn nhập lịch'
      />

      <ExportCalendarDialog
        calendarData={mergedExportData}
        onExport={handleExport}
        onOpenChange={setIsExportModalOpen}
        open={isExportModalOpen}
      />

      <Dialog onOpenChange={setImportSemesterOpen} open={importSemesterOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Nhập tên học kỳ</DialogTitle>
            <DialogDescription>File Excel lịch học không có tên học kỳ. Vui lòng nhập tên học kỳ.</DialogDescription>
          </DialogHeader>
          <div className='mt-4 space-y-2'>
            <Label htmlFor='semester-name'>Tên học kỳ</Label>
            <Input
              autoFocus
              id='semester-name'
              onChange={(e) => setImportSemesterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleStudySemesterConfirm();
                }
              }}
              placeholder='VD: Học kỳ 2 (2024-2025)'
              value={importSemesterName}
            />
          </div>
          <DialogFooter className='mt-4'>
            <Button disabled={!importSemesterName.trim()} onClick={handleStudySemesterConfirm}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
