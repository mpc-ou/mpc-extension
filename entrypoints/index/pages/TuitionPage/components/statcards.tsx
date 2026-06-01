import { Coins, GraduationCap, InfoIcon, Landmark, ReceiptText, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { memo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TuitionStatsType } from "@/types";
import { formatVND } from "@/utils/tuition-compute";

const BASE = "rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md";

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  hint,
  colorClass
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  hint?: string;
  colorClass: string;
}) {
  return (
    <div className={BASE}>
      <div className='flex items-start justify-between'>
        <div className='space-y-1'>
          <p className='flex items-center gap-1 font-medium text-muted-foreground text-xs uppercase tracking-wider'>
            {label}
            {hint && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className='h-3 w-3 cursor-help' />
                </TooltipTrigger>
                <TooltipContent side='top'>
                  <p className='max-w-48 text-xs'>{hint}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </p>
          <p className='font-bold text-xl tracking-tight'>{value}</p>
          {sub && <p className='text-muted-foreground text-xs'>{sub}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colorClass)}>
          <Icon className='h-5 w-5' />
        </div>
      </div>
    </div>
  );
});

export const TuitionStatCards = memo(function TuitionStatCards({
  stats,
  scholarshipRefund
}: {
  stats: TuitionStatsType;
  scholarshipRefund: { total: number; semesterCount: number };
}) {
  return (
    <>
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatCard
          colorClass='bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          icon={Landmark}
          label='Tổng tiền đã đóng'
          sub={`${stats.semesterCount} học kỳ`}
          value={formatVND(stats.totalSpent)}
        />
        <StatCard
          colorClass={
            stats.totalDebt > 0
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }
          icon={Wallet}
          label='Còn nợ'
          value={formatVND(stats.totalDebt)}
        />
        <StatCard
          colorClass='bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          icon={Coins}
          label='Trung bình / kỳ'
          value={formatVND(stats.avgPerSemester)}
        />
        <StatCard
          colorClass='bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
          icon={ReceiptText}
          label='Đơn giá TB / tín chỉ'
          sub={`${formatVND(stats.minPerCredit)} – ${formatVND(stats.maxPerCredit)}`}
          value={stats.avgPerCredit > 0 ? formatVND(stats.avgPerCredit) : "—"}
        />
      </div>
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatCard
          colorClass='bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          icon={GraduationCap}
          label='Tiền học bổng tổng nhận'
          sub={
            scholarshipRefund.semesterCount > 0 ? `${scholarshipRefund.semesterCount} kì có học bổng` : "Chưa đánh dấu"
          }
          value={formatVND(scholarshipRefund.total)}
        />
        <StatCard
          colorClass='bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          icon={TrendingUp}
          label='Kỳ cao nhất'
          sub={stats.mostExpensiveSemester.name}
          value={formatVND(stats.mostExpensiveSemester.amount)}
        />
        <StatCard
          colorClass='bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
          icon={TrendingDown}
          label='Kỳ thấp nhất'
          sub={stats.cheapestSemester.name}
          value={formatVND(stats.cheapestSemester.amount)}
        />
        <StatCard
          colorClass='bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
          hint='Tính cả các môn quốc phòng, tiếng Anh, thi đầu ra và các loại phí khác'
          icon={GraduationCap}
          label='Tổng tín chỉ'
          sub={`${stats.totalCreditsWithOther} nếu tính cả các môn khác`}
          value={`${stats.totalCredits}`}
        />
      </div>
    </>
  );
});
