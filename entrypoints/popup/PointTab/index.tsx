import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { browser } from "wxt/browser";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { _GET_CURRENT_URL, _GET_POINT_DATA } from "@/constants/chrome";
import { _DEFAULT_FIXED_POINT } from "@/constants/default";
import { ScoreFilterType, ScoreGroupType, ScoreSumaryType } from "./type";

const PointTab = () => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [sumary, setSumary] = useState<ScoreSumaryType>({ semesterCount: 0, totalCredit: 0, gpa10: 0, gpa4: 0 });
  const [pointData, setPointData] = useState<ScoreGroupType[]>([]);
  const [filter, setFilter] = useState<ScoreFilterType>({
    queryText: "",
    isOnlyCalcGPA: false
  });

  const updateScoreAvg = (data: ScoreGroupType[]) => {
    const newData = data.map((d) => {
      const totalCredit = d.data.reduce((acc, curr) => {
        const isIgnoreCredit = curr.isIgnore || !curr.point.character || curr.point.character === "F";
        if (isIgnoreCredit) {
          return acc;
        }
        return acc + curr.credit;
      }, 0);

      const avg = d.data.reduce(
        (acc, curr) => {
          const point = curr.point;
          const credit = curr.credit;

          const isValidPoint =
            typeof credit === "number" &&
            typeof point.scale10 === "number" &&
            typeof point.scale4 === "number" &&
            !Number.isNaN(point.scale10) &&
            !Number.isNaN(point.scale4);

          if (!isValidPoint || curr.isIgnore) {
            return acc;
          }

          return {
            point: {
              scale10: acc.point.scale10 + point.scale10 * credit,
              scale4: acc.point.scale4 + point.scale4 * credit
            },
            credit: acc.credit + credit
          };
        },
        {
          point: {
            scale10: 0,
            scale4: 0
          },
          credit: 0
        }
      );

      d.totalCredit = totalCredit;
      d.avgPoint = {
        scale10: Number.parseFloat((avg.point.scale10 / avg.credit).toFixed(_DEFAULT_FIXED_POINT)),
        scale4: Number.parseFloat((avg.point.scale4 / avg.credit).toFixed(_DEFAULT_FIXED_POINT))
      };

      return d;
    });

    return newData;
  };

  const updateSumary = (data: ScoreGroupType[]) => {
    const totalCredit = data.reduce((acc, curr) => acc + curr.totalCredit, 0);

    let sumScale10 = 0;
    let sumScale4 = 0;
    let sumCredit = 0;

    for (const item of data) {
      for (const curr of item.data) {
        const { credit, point } = curr;

        if (
          curr.isIgnore ||
          typeof credit !== "number" ||
          typeof point.scale10 !== "number" ||
          typeof point.scale4 !== "number" ||
          Number.isNaN(credit) ||
          Number.isNaN(point.scale10) ||
          Number.isNaN(point.scale4)
        ) {
          continue;
        }

        sumScale10 += point.scale10 * credit;
        sumScale4 += point.scale4 * credit;
        sumCredit += credit;
      }
    }

    setSumary({
      semesterCount: data.length,
      totalCredit,
      gpa10: sumCredit > 0 ? +(sumScale10 / sumCredit).toFixed(_DEFAULT_FIXED_POINT) : 0,
      gpa4: sumCredit > 0 ? +(sumScale4 / sumCredit).toFixed(_DEFAULT_FIXED_POINT) : 0
    });
  };

  const handleImportData = async () => {
    const data: ScoreGroupType[] = await browser.runtime.sendMessage({ type: _GET_POINT_DATA });
    const updatedData = updateScoreAvg(data);
    setPointData(updatedData);
    updateSumary(updatedData);
    setLastUpdate(new Date());
    toast.success("Nhập dữ liệu thành công!");
  };

  return (
    <section className='py-2'>
      <div>
        <div className='flex justify-center gap-1'>
          <Button onClick={handleImportData} size='sm'>
            Nhập dữ liệu mới
          </Button>
          <Button size='sm'>Xuất dữ liệu</Button>
        </div>
        <div className='mt-2 flex justify-center'>
          <time>Cập nhật lần cuối: {lastUpdate ? lastUpdate.toLocaleString() : "Chưa có dữ liệu"}</time>
        </div>
      </div>

      <div className='space-y-4 p-4'>
        <div className='flex items-center gap-4'>
          <Input
            className='flex-1'
            onChange={(e) => setFilter((prev) => ({ ...prev, queryText: e.target.value }))}
            placeholder='Tìm theo tên môn học...'
            value={filter.queryText}
          />

          <div className='flex items-center gap-2'>
            <Checkbox
              checked={filter.isOnlyCalcGPA}
              id='only-gpa'
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, isOnlyCalcGPA: (e.target as HTMLInputElement).checked }))
              }
            />
            <Label className='cursor-pointer' htmlFor='only-gpa'>
              Chỉ GPA
            </Label>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-y-1 text-sm'>
          <div className='text-muted-foreground'>Học kỳ:</div>
          <div className='text-right font-medium'>{sumary.semesterCount}</div>

          <div className='text-muted-foreground'>Tín chỉ:</div>
          <div className='text-right font-medium'>{sumary.totalCredit}</div>

          <div className='text-muted-foreground'>GPA (Hệ 10):</div>
          <div className='text-right font-medium'>{sumary.gpa10}</div>

          <div className='text-muted-foreground'>GPA (Hệ 4):</div>
          <div className='text-right font-medium'>{sumary.gpa4}</div>
        </div>
      </div>

      <div className='space-y-4 px-2'>
        {pointData.map((semester) => (
          <div className='overflow-hidden rounded-md border' key={semester.id}>
            <div className='bg-blue-100 px-4 py-2'>
              <div className='font-semibold'>{semester.title}</div>
              <div className='text-muted-foreground text-sm'>
                Hệ 10: {semester.avgPoint.scale10 || "-"} &nbsp;–&nbsp; Hệ 4: {semester.avgPoint.scale4 || "-"}
              </div>
            </div>

            <Table className='w-full table-fixed'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[15%]'>Mã môn</TableHead>
                  <TableHead className='w-[38%]'>Tên môn</TableHead>
                  <TableHead className='w-[6%] text-center'>TC</TableHead>
                  <TableHead className='w-[8%] text-center'>Hệ 10</TableHead>
                  <TableHead className='w-[8%] text-center'>Hệ 4</TableHead>
                  <TableHead className='w-[10%] text-center'>Điểm</TableHead>
                  <TableHead className='w-[6%] text-center' />
                </TableRow>
              </TableHeader>

              <TableBody>
                {semester.data.map((course) => (
                  <TableRow key={course.code}>
                    <TableCell className='w-[15%]'>{course.code}</TableCell>
                    <TableCell className='w-[38%] truncate'>{course.name}</TableCell>
                    <TableCell className='w-[6%] text-center'>{course.credit}</TableCell>
                    <TableCell className='w-[8%] text-center'>{course.point.scale10 ?? "-"}</TableCell>
                    <TableCell className='w-[8%] text-center'>{course.point.scale4 ?? "-"}</TableCell>
                    <TableCell className='w-[10%] text-center'>{course.point.character}</TableCell>
                    <TableCell className='w-[6%] text-center'>
                      <Trash2Icon className='mx-auto h-4 w-4 text-red-500' />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </section>
  );
};

export { PointTab };
