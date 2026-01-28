import { ImportIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useScoreStore } from "@/entrypoints/sidepanel/PointTab/use-score-store";
import { CharacterPointChart } from "@/entrypoints/sidepanel/StatisticTab/Chartjs/character-point-chart";
import { SemesterAverageChart } from "@/entrypoints/sidepanel/StatisticTab/Chartjs/semester-avg-chart";
import { StatisticDataType } from "@/entrypoints/sidepanel/StatisticTab/type";
import { calculateStatistics } from "@/entrypoints/sidepanel/StatisticTab/utils";
import { useGlobalStore } from "@/store/use-global-store";

const StatisticTab = () => {
  const scores = useScoreStore((s) => s.scores);
  const fixedPoint = useGlobalStore((s) => s.fixedPoint);
  const setTab = useGlobalStore((s) => s.setTab);
  const [statistics, setStatistics] = useState<StatisticDataType | null>(null);

  useEffect(() => {
    const loadStatistics = () => {
      if (scores.length === 0) {
        setStatistics(null);
        return;
      }
      const stats = calculateStatistics(scores);
      setStatistics(stats);
    };
    loadStatistics();
  }, [scores]);

  if (statistics === null) {
    return (
      <Empty className='h-full bg-linear-to-b from-30% from-muted/50 to-background'>
        <EmptyHeader>
          <EmptyMedia>
            <ImportIcon className='h-12 w-12 text-muted-foreground' />
          </EmptyMedia>
          <EmptyTitle>Chưa có dữ liệu điểm!</EmptyTitle>
          <EmptyDescription>Vui lòng sang tab điểm để nhập dữ liệu trước!</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => setTab("point")} size='sm'>
            Sang tab điểm
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className='space-y-8 p-8'>
      <SemesterAverageChart fixedPoint={fixedPoint} statistic={statistics} />
      <CharacterPointChart data={statistics.character.detail} total={statistics.character.total} />

      <div className='space-y-4 px-4 text-sm'>
        <h3 className='font-bold text-xl tracking-tight'>Tổng quan</h3>
        <div>
          <div className='flex justify-between font-semibold'>
            <span>Tín chỉ</span>
            <span>{statistics.credit.total}</span>
          </div>
          <div className='grid grid-cols-2 gap-x-4'>
            <span>Số lượng:</span>
            <span className='text-right'>{statistics.credit.valid}</span>

            <span>Không tính GPA:</span>
            <span className='text-right'>{statistics.credit.ignore}</span>
          </div>
        </div>

        <div>
          <div className='flex justify-between font-semibold'>
            <span>Học kỳ</span>
            <span>{statistics.semester.total}</span>
          </div>
          <div className='grid grid-cols-2 gap-x-4'>
            <span>Số lượng:</span>
            <span className='text-right'>{statistics.semester.valid}</span>

            <span>Không tính GPA:</span>
            <span className='text-right'>{statistics.semester.ignore}</span>

            <span>Điểm TB mỗi kỳ (10):</span>
            <span className='text-right'>{statistics.semester.avg10.toFixed(fixedPoint)}</span>

            <span>Điểm TB mỗi kỳ (4):</span>
            <span className='text-right'>{statistics.semester.avg4.toFixed(fixedPoint)}</span>
          </div>
        </div>

        <div>
          <div className='flex justify-between font-semibold'>
            <span>Môn học</span>
            <span>{statistics.subject.total}</span>
          </div>
          <div className='grid grid-cols-2 gap-x-4'>
            <span>Số lượng:</span>
            <span className='text-right'>{statistics.subject.valid}</span>

            <span>Không tính GPA:</span>
            <span className='text-right'>{statistics.subject.ignore}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { StatisticTab };
