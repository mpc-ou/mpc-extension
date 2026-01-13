import { format } from "date-fns";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  ClipboardCopyIcon,
  FileOutputIcon,
  ImportIcon,
  PlusIcon
} from "lucide-react";
import { Activity, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { toast } from "sonner";
import { browser } from "wxt/browser";
import { ButtonNavSite } from "@/components/custom/button-nav-site";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { _GET_POINT_DATA } from "@/constants/chrome";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { _DEFAULT_SCORE_SUMMARY } from "@/entrypoints/popup/PointTab/default";
import { useScoreStore } from "@/entrypoints/popup/PointTab/use-score-store";
import { useGlobalStore } from "@/store/use-global-store";
import { DataTable } from "./data-table";
import { FormSemesterDialog } from "./form-semester-dialog";
import { ScoreGroupType, ScoreRecordType, ScoreSummaryType } from "./type";
import { getScoreSummary, handleExportData, updateIgnoreSubject, updateScoreAvg } from "./utils";

const PointTab = () => {
  const siteCurr = useGlobalStore((s) => s.siteCurr);
  const siteCurrURL = useGlobalStore((s) => s.siteCurrURL);
  const fixedPoint = useGlobalStore((s) => s.fixedPoint);
  const ignoreList = useGlobalStore((s) => s.ignoreList);
  const { setScores, scores, filter, setFilter, lastUpdate, setLastUpdate, saveData, getData } = useScoreStore();
  const [summary, setSummary] = useState<ScoreSummaryType>(_DEFAULT_SCORE_SUMMARY);

  const [semesterDialog, setSemesterDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    semesterIdx?: number;
  }>({
    open: false,
    mode: "add"
  });

  const handleUpdateSummary = useCallback((data: ScoreGroupType[]) => {
    const updatedSummary = getScoreSummary(data);
    setSummary(updatedSummary);
  }, []);

  const updateIgnoreAndAvg = useCallback(
    (data: ScoreGroupType[]) => {
      const updatedIgnoreData = updateIgnoreSubject(data, ignoreList);
      const updatedData = updateScoreAvg(updatedIgnoreData);
      return updatedData;
    },
    [ignoreList]
  );

  const saveCurrentData = async (data: ScoreGroupType[]) => {
    const updatedData = updateIgnoreAndAvg(data);
    const updatedSummary = getScoreSummary(updatedData);
    setSummary(updatedSummary);

    setScores(updatedData);
    setLastUpdate(new Date());
    await saveData();
  };

  const handleImportData = async () => {
    if (siteCurrURL !== _DEFAULT_SITE_URL_MAPPING[siteCurr].point) {
      toast.error("Vui lòng truy cập trang điểm để nhập dữ liệu!");
      return;
    }

    const data: ScoreGroupType[] = await browser.runtime.sendMessage({
      type: _GET_POINT_DATA
    });
    await saveCurrentData(data);
    toast.success("Nhập dữ liệu thành công!");
  };

  const handleDeleteSubject = (semesterIdx: number, subjectIdx: number) => {
    const newPointData = [...scores];
    newPointData[semesterIdx].data.splice(subjectIdx, 1);

    saveCurrentData(newPointData);
  };

  const handleAddSubject = (semesterIdx: number, subject: Omit<ScoreRecordType, "isIgnore" | "isHead">) => {
    const newPointData = [...scores];
    newPointData[semesterIdx].data.unshift(subject);

    saveCurrentData(newPointData);
    toast.success("Thêm môn học thành công!");
  };

  const handleEditSubject = (
    semesterIdx: number,
    subjectIdx: number,
    subject: Omit<ScoreRecordType, "isIgnore" | "isHead">
  ) => {
    const newPointData = [...scores];
    newPointData[semesterIdx].data[subjectIdx] = subject;

    saveCurrentData(newPointData);
    toast.success("Cập nhật môn học thành công!");
  };

  const handleChangeFilter = (value: string | boolean, type: "search" | "gpa") => {
    if (type === "search") {
      const filterObj = {
        ...filter,
        queryText: String(value)
      };
      setFilter(filterObj);
    } else {
      const filterObj = {
        ...filter,
        isOnlyCalcGPA: Boolean(value)
      };
      setFilter(filterObj);
    }
  };

  useEffect(() => {
    handleUpdateSummary(scores);
  }, [scores, handleUpdateSummary]);

  useLayoutEffect(() => {
    const getOldData = async () => {
      await getData();
    };
    getOldData();
  }, [getData]);

  const handleSemesterSubmit = (semesterName: string) => {
    const newPointData = [...scores];

    if (semesterDialog.mode === "add") {
      newPointData.unshift({
        title: semesterName,
        data: [],
        id: newPointData.length > 0 ? Math.max(...newPointData.map((item) => item.id)) + 1 : 1,
        totalCredit: 0,
        avgPoint: { scale10: null, scale4: null }
      });
      toast.success("Thêm học kỳ thành công!");
    } else if (semesterDialog.semesterIdx !== undefined) {
      newPointData[semesterDialog.semesterIdx].title = semesterName;
      toast.success("Cập nhật học kỳ thành công!");
    }

    saveCurrentData(newPointData);
    setSemesterDialog({ open: false, mode: "add" });
  };

  const handleDeleteSemester = (semesterIdx: number) => {
    const newPointData = [...scores];
    newPointData.splice(semesterIdx, 1);

    saveCurrentData(newPointData);
    toast.success("Xóa học kỳ thành công!");
  };

  const handleCopyData = () => {
    const exportData = {
      summary: {
        semesterCount: summary.semesterCount,
        totalSubject: summary.totalSubject,
        totalCredit: summary.totalCredit,
        gpa10: summary.gpa10,
        gpa4: summary.gpa4
      },
      lastUpdate: lastUpdate?.toISOString(),
      scores
    };

    const jsonData = JSON.stringify(exportData, null, 2);

    navigator.clipboard
      .writeText(jsonData)
      .then(() => {
        toast.success("Đã sao chép dữ liệu JSON vào clipboard!");
      })
      .catch(() => {
        toast.error("Không thể sao chép dữ liệu!");
      });
  };

  return (
    <section>
      <Alert className='border-none p-0'>
        <AlertDescription>
          <div className='mx-auto flex items-center justify-center text-center'>
            Dữ liệu cần được lấy từ:{" "}
            <ButtonNavSite url={_DEFAULT_SITE_URL_MAPPING[siteCurr].point} variant='link'>
              {_DEFAULT_SITE_URL_MAPPING[siteCurr].point}
            </ButtonNavSite>
            {siteCurrURL === _DEFAULT_SITE_URL_MAPPING[siteCurr].point ? (
              <CircleCheckIcon className='ml-2 h-5 w-5 text-green-500' />
            ) : (
              <CircleAlertIcon className='ml-2 h-5 w-5 text-red-500' />
            )}
          </div>
        </AlertDescription>
      </Alert>

      <Activity mode={scores.length === 0 ? "visible" : "hidden"}>
        <Empty className='h-full bg-linear-to-b from-30% from-muted/50 to-background'>
          <EmptyHeader>
            <EmptyMedia>
              <ImportIcon className='h-12 w-12 text-muted-foreground' />
            </EmptyMedia>
            <EmptyTitle>Chưa có dữ liệu điểm!</EmptyTitle>
            <EmptyDescription>Vui lòng truy cập trang điểm trên Tiện ích để nhập dữ liệu điểm.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className='flex gap-2'>
              <ButtonNavSite size='sm' url={_DEFAULT_SITE_URL_MAPPING[siteCurr].point}>
                Đến trang điểm
              </ButtonNavSite>
              <Button onClick={handleImportData} size='sm'>
                Nhập dữ liệu
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </Activity>

      <Activity mode={scores.length === 0 ? "hidden" : "visible"}>
        <div className='space-y-3 p-4 pb-0'>
          <div className='flex justify-end gap-2'>
            <Button onClick={handleImportData} size='sm'>
              Nhập dữ liệu mới
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size='sm' variant='outline'>
                  Thao tác
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onSelect={() => {
                    handleExportData(scores);
                  }}
                >
                  <FileOutputIcon className='mr-2 h-4 w-4 text-green-500' />
                  Xuất điểm
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleCopyData}>
                  <ClipboardCopyIcon className='mr-2 h-4 w-4 text-blue-500' />
                  Sao chép dữ liệu
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className='flex justify-end'>
            <time className='text-muted-foreground text-xs'>
              Cập nhật lần cuối: {lastUpdate ? format(lastUpdate, "dd/MM/yyyy HH:mm:ss") : "Chưa có dữ liệu"}
            </time>
          </div>
        </div>

        <div className='grid grid-cols-4 gap-3 p-4'>
          <div className='rounded-lg border bg-card p-4 shadow-sm'>
            <div className='mb-1 text-muted-foreground text-xs'>Số học kỳ</div>
            <div className='font-bold text-2xl text-primary'>{summary.semesterCount}</div>
          </div>

          <div className='rounded-lg border bg-card p-4 shadow-sm'>
            <div className='mb-1 text-muted-foreground text-xs'>Số môn học</div>
            <div className='font-bold text-2xl text-primary'>
              {filter.isOnlyCalcGPA
                ? scores.reduce((acc, curr) => {
                    const filteredCount = curr.data.filter((item) => !item.isIgnore && item.point.character).length;
                    return acc + filteredCount;
                  }, 0)
                : scores.reduce((acc, curr) => acc + curr.data.length, 0)}
            </div>
            {filter.isOnlyCalcGPA === true && (
              <div className='mt-1 text-muted-foreground text-sm'>
                Tổng: <b>{scores.reduce((acc, curr) => acc + curr.data.length, 0)}</b>
              </div>
            )}
          </div>

          <div className='rounded-lg border bg-card p-4 shadow-sm'>
            <div className='mb-1 text-muted-foreground text-xs'>GPA</div>
            <div className='font-bold text-2xl text-primary'>{summary.gpa4.toFixed(fixedPoint)}</div>
            <div className='mt-1 text-muted-foreground text-sm'>
              Hệ 10: <b>{summary.gpa10.toFixed(fixedPoint)}</b>
            </div>
          </div>

          <div className='rounded-lg border bg-card p-4 shadow-sm'>
            <div className='mb-1 text-muted-foreground text-xs'>Tổng tín chỉ</div>
            <div className='font-bold text-2xl text-primary'>{summary.totalCredit}</div>
          </div>
        </div>

        <Separator className='mx-auto mb-4 max-w-[95%]' />

        <div className='space-y-4 px-4 pb-4'>
          <div className='flex items-center gap-2'>
            <Input
              className='flex-1'
              // To do: debounce
              onChange={(e) => handleChangeFilter(e.target.value, "search")}
              placeholder='Tìm theo tên môn học...'
              value={filter.queryText}
            />

            <div className='flex items-center gap-2 whitespace-nowrap'>
              <Checkbox
                checked={filter.isOnlyCalcGPA}
                id='only-gpa'
                onCheckedChange={(value) => handleChangeFilter(value, "gpa")}
              />
              <Label className='cursor-pointer' htmlFor='only-gpa'>
                Chỉ GPA
              </Label>
            </div>
          </div>
          <div className='flex justify-end'>
            <Button onClick={() => setSemesterDialog({ open: true, mode: "add" })} size='sm' variant='outline'>
              <PlusIcon className='mr-2 h-4 w-4' />
              Thêm học kỳ
            </Button>
          </div>
        </div>

        <DataTable
          data={scores}
          filter={filter}
          fixedPoint={fixedPoint}
          handleAddSubject={handleAddSubject}
          handleDeleteSemester={handleDeleteSemester}
          handleDeleteSubject={handleDeleteSubject}
          handleEditSemester={(idx) => setSemesterDialog({ open: true, mode: "edit", semesterIdx: idx })}
          handleEditSubject={handleEditSubject}
        />
      </Activity>

      <FormSemesterDialog
        initialValue={
          semesterDialog.mode === "edit" && semesterDialog.semesterIdx !== undefined
            ? scores[semesterDialog.semesterIdx]?.title || ""
            : "Học kỳ mới"
        }
        mode={semesterDialog.mode}
        onOpenChange={(open) => setSemesterDialog({ ...semesterDialog, open })}
        onSubmit={handleSemesterSubmit}
        open={semesterDialog.open}
      />
    </section>
  );
};

export { PointTab };
