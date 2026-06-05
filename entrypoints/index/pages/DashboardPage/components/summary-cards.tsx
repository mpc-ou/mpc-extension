import { AwardIcon, BookOpenIcon, GraduationCapIcon, LayersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFixed } from "@/utils";

export function SummaryCards({
  gpa4,
  gpa10,
  fixedPoint,
  totalCredit,
  totalSubject,
  avgTrainingPoint,
  trainingSemesters,
  semesterCount
}: {
  gpa4: number;
  gpa10: number;
  fixedPoint: number;
  totalCredit: number;
  totalSubject: number;
  avgTrainingPoint: number;
  trainingSemesters: number;
  semesterCount: number;
}) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <Card className='relative gap-2 overflow-hidden py-4'>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='font-medium text-muted-foreground text-sm'>GPA tích lũy</CardTitle>
          <GraduationCapIcon className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='font-bold text-3xl'>{formatFixed(gpa4, fixedPoint)}</div>
          <p className='mt-1 text-muted-foreground text-xs'>
            Hệ 10: <span className='font-semibold text-foreground'>{formatFixed(gpa10, fixedPoint)}</span>
          </p>
          <div className='absolute right-0 bottom-0 h-12 w-12 rounded-tl-full bg-primary/5' />
        </CardContent>
      </Card>

      <Card className='relative gap-2 overflow-hidden py-4'>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='font-medium text-muted-foreground text-sm'>Tổng tín chỉ</CardTitle>
          <BookOpenIcon className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='font-bold text-3xl'>{totalCredit}</div>
          <p className='mt-1 text-muted-foreground text-xs'>{totalSubject} môn học</p>
        </CardContent>
      </Card>

      <Card className='relative gap-2 overflow-hidden py-4'>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='font-medium text-muted-foreground text-sm'>ĐRL trung bình</CardTitle>
          <AwardIcon className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='font-bold text-3xl'>{formatFixed(avgTrainingPoint, fixedPoint)}</div>
          <p className='mt-1 text-muted-foreground text-xs'>
            Tính trong {trainingSemesters > 0 ? `${trainingSemesters} học kì đầu` : "tất cả học kì"}
          </p>
        </CardContent>
      </Card>

      <Card className='relative gap-2 overflow-hidden py-4'>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='font-medium text-muted-foreground text-sm'>Số học kỳ</CardTitle>
          <LayersIcon className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='font-bold text-3xl'>{semesterCount}</div>
          <p className='mt-1 text-muted-foreground text-xs'>Tổng {totalCredit} TC tích lũy</p>
        </CardContent>
      </Card>
    </div>
  );
}
