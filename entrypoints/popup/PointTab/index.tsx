import { format } from "date-fns";
import { CircleAlertIcon, CircleCheckIcon, ImportIcon } from "lucide-react";
import { Activity, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { toast } from "sonner";
import { browser } from "wxt/browser";
import { ButtonNavSite } from "@/components/custom/button-nav-site";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { _GET_POINT_DATA } from "@/constants/chrome";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { _DEFAULT_SCORE_SUMMARY } from "@/entrypoints/popup/PointTab/default";
import { useScoreStore } from "@/entrypoints/popup/PointTab/use-score-store";
import { useGlobalStore } from "@/store/use-global-store";
import { navigateToURL } from "@/utils";
import { DataTable } from "./data-table";
import { ScoreGroupType, ScoreRecordType, ScoreSummaryType } from "./type";
import { getScoreSummary, handleExportData, updateIgnoreSubject, updateScoreAvg } from "./utils";
// 1. IMPORT YOUR NEW HOOK
import { useConfig } from "@/hooks/useConfig";

const PointTab = () => {
  const siteCurr = useGlobalStore((s) => s.siteCurr);
  const siteCurrURL = useGlobalStore((s) => s.siteCurrURL);
  const { setScores, scores, filter, setFilter, lastUpdate, setLastUpdate, saveData, getData } = useScoreStore();
  const [summary, setSummary] = useState<ScoreSummaryType>(_DEFAULT_SCORE_SUMMARY);

  // 2. GET CONFIG VALUES
  const { fixedPoint, ignoreList } = useConfig();

  // 3. PASS CONFIG TO SUMMARY CALCULATION
  const handleUpdateSummary = useCallback((data: ScoreGroupType[]) => {
    const updatedSummary = getScoreSummary(data, fixedPoint);
    setSummary(updatedSummary);
  }, [fixedPoint]); // Re-run if user changes setting

  const handleNavigate = async (url: string) => {
    await navigateToURL(url);
  };

  const saveCurrentData = async (data: ScoreGroupType[]) => {
    // 4. PASS CONFIG TO DATA PROCESSING FUNCTIONS
    const updatedIgnoreData = updateIgnoreSubject(data, ignoreList);
    const updatedData = updateScoreAvg(updatedIgnoreData, fixedPoint);

    const updatedSummary = getScoreSummary(updatedData, fixedPoint);
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

    const data: ScoreGroupType[] = await browser.runtime.sendMessage({ type: _GET_POINT_DATA });
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

  // OPTIONAL: Re-calculate scores if ignoreList changes (Optional refinement)
  useEffect(() => {
     if(scores.length > 0) {
        // This ensures that if you add a subject to the ignore list in the config,
        // it updates the GPA immediately without needing to re-import data.
        const updatedIgnoreData = updateIgnoreSubject(scores, ignoreList);
        const updatedData = updateScoreAvg(updatedIgnoreData, fixedPoint);
        setScores(updatedData);
     }
  }, [ignoreList, fixedPoint, setScores]);


  useLayoutEffect(() => {
    const getOldData = async () => {
      await getData();
    };
    getOldData();
  }, [getData]);

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
        <div className='py-2'>
          <div className='flex justify-center gap-1'>
            <Button onClick={handleImportData} size='sm'>
              Nhập dữ liệu mới
            </Button>
            <Button onClick={() => handleExportData(scores)} size='sm'>
              Xuất dữ liệu
            </Button>
          </div>
          <div className='mt-2 flex justify-center'>
            <time>Cập nhật lần cuối: {lastUpdate ? format(lastUpdate, "dd/MM/yyyy HH:mm:ss") : "Chưa có dữ liệu"}</time>
          </div>
        </div>

        <div className='space-y-4 p-4'>
          <div className='flex items-center gap-4'>
            <Input
              className='flex-1'
              // TODO: Debounce
              onChange={(e) => handleChangeFilter(e.target.value, "search")}
              placeholder='Tìm theo tên môn học...'
              value={filter.queryText}
            />

            <div className='flex items-center gap-2'>
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

          <div className='grid grid-cols-2 gap-y-1 text-sm'>
            <div className='text-muted-foreground'>Học kỳ:</div>
            <div className='text-right font-medium'>{summary.semesterCount}</div>

            <div className='text-muted-foreground'>Tín chỉ:</div>
            <div className='text-right font-medium'>{summary.totalCredit}</div>

            <div className='text-muted-foreground'>GPA (Hệ 10):</div>
            <div className='text-right font-medium'>{summary.gpa10}</div>

            <div className='text-muted-foreground'>GPA (Hệ 4):</div>
            <div className='text-right font-medium'>{summary.gpa4}</div>
          </div>
        </div>

        <DataTable
          data={scores}
          filter={filter}
          handleAddSubject={handleAddSubject}
          handleDeleteSubject={handleDeleteSubject}
          handleEditSubject={handleEditSubject}
        />
      </Activity>
    </section>
  );
};

export { PointTab };