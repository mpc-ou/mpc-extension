import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { browser } from "wxt/browser";
import { storage } from "#imports";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { _DEBOUNCE_TIME } from "@/constants";
import { _GET_CURRENT_URL, _GET_POINT_DATA, _KEY_STORAGE_POINT_DATA } from "@/constants/chrome";
import { _DEFAULT_FIXED_POINT, _DEFAULT_IGNORE_SUBJECT_DATA } from "@/constants/default";
import { DataTable } from "./data-table";
import { PointStorageType, ScoreFilterType, ScoreGroupType, ScoreRecordType, ScoreSumaryType } from "./type";
import { getScoreSummary, handleExportData, updateIgnoreSubject, updateScoreAvg } from "./utils";

const PointTab = () => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [summary, setSummary] = useState<ScoreSumaryType>({ semesterCount: 0, totalCredit: 0, gpa10: 0, gpa4: 0 });
  const [pointData, setPointData] = useState<ScoreGroupType[]>([]);
  const [filter, setFilter] = useState<ScoreFilterType>({
    queryText: "",
    isOnlyCalcGPA: false
  });

  const handleUpdateSummary = useCallback((data: ScoreGroupType[]) => {
    const updatedSummary = getScoreSummary(data);
    setSummary(updatedSummary);
  }, []);

  const saveCurrentData = async (data: ScoreGroupType[]) => {
    const updatedIgnoreData = updateIgnoreSubject(data);
    const updatedData = updateScoreAvg(updatedIgnoreData);

    const updatedSummary = getScoreSummary(updatedData);
    setSummary(updatedSummary);

    setPointData(updatedData);
    setLastUpdate(new Date());

    const saveData: PointStorageType = {
      filter,
      data: updatedData,
      updatedAt: new Date().toISOString()
    };

    await storage.setItem(`local:${_KEY_STORAGE_POINT_DATA}`, saveData);
  };

  const handleImportData = async () => {
    const data: ScoreGroupType[] = await browser.runtime.sendMessage({ type: _GET_POINT_DATA });
    await saveCurrentData(data);
    toast.success("Nhập dữ liệu thành công!");
  };

  const handleDeleteSubject = (semesterIdx: number, subjectIdx: number) => {
    const newPointData = [...pointData];
    newPointData[semesterIdx].data.splice(subjectIdx, 1);

    saveCurrentData(newPointData);
  };

  const handleAddSubject = (semesterIdx: number, subject: Omit<ScoreRecordType, "isIgnore" | "isHead">) => {
    const newPointData = [...pointData];
    newPointData[semesterIdx].data.unshift(subject);

    saveCurrentData(newPointData);
    toast.success("Thêm môn học thành công!");
  };

  const handleEditSubject = (
    semesterIdx: number,
    subjectIdx: number,
    subject: Omit<ScoreRecordType, "isIgnore" | "isHead">
  ) => {
    const newPointData = [...pointData];
    newPointData[semesterIdx].data[subjectIdx] = subject;

    saveCurrentData(newPointData);
    toast.success("Cập nhật môn học thành công!");
  };

  const handleChangeFilter = (value: string | boolean, type: "search" | "gpa") => {
    if (type === "search") {
      setFilter((prev) => ({ ...prev, queryText: value as string }));
    } else {
      setFilter((prev) => ({ ...prev, isOnlyCalcGPA: Boolean(value) }));
    }
  };

  useEffect(() => {
    const applyFilter = async () => {
      const oldData: PointStorageType = (await storage.getItem(`local:${_KEY_STORAGE_POINT_DATA}`)) || {
        filter: { queryText: "", isOnlyCalcGPA: false },
        data: [],
        updatedAt: new Date().toISOString()
      };

      const saveData: PointStorageType = {
        filter,
        data: oldData.data,
        updatedAt: oldData.updatedAt
      };

      await storage.setItem(`local:${_KEY_STORAGE_POINT_DATA}`, saveData);
    };

    applyFilter();
  }, [filter]);

  useEffect(() => {
    const getOldData = async () => {
      const defaultData: PointStorageType = {
        filter: { queryText: "", isOnlyCalcGPA: false },
        data: [],
        updatedAt: new Date().toISOString()
      };
      const oldData: PointStorageType = (await storage.getItem(`local:${_KEY_STORAGE_POINT_DATA}`)) || defaultData;

      if (oldData) {
        setPointData(oldData.data);
        setFilter(oldData.filter);
        console.info("[index.tsx:91] ", oldData.filter);
        setLastUpdate(new Date(oldData.updatedAt));
        handleUpdateSummary(oldData.data);
      }
    };

    getOldData();
  }, [handleUpdateSummary]);

  return (
    <section className='py-2'>
      <div>
        <div className='flex justify-center gap-1'>
          <Button onClick={handleImportData} size='sm'>
            Nhập dữ liệu mới
          </Button>
          <Button onClick={() => handleExportData(pointData)} size='sm'>
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
        data={pointData}
        filter={filter}
        handleAddSubject={handleAddSubject}
        handleDeleteSubject={handleDeleteSubject}
        handleEditSubject={handleEditSubject}
      />
    </section>
  );
};

export { PointTab };
