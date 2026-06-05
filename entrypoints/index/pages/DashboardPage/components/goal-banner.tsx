import { ArrowRightIcon, RocketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GoalBanner({
  plannedGpa4,
  currentGpa4,
  fixedPoint
}: {
  plannedGpa4: number;
  currentGpa4: number;
  fixedPoint: number;
}) {
  return (
    <div className='relative overflow-hidden rounded-xl border border-emerald-500/30 bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 p-4'>
      <div className='flex items-center gap-4'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20'>
          <RocketIcon className='h-5 w-5 text-emerald-500' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='font-semibold text-foreground text-sm'>Bạn đang có mục tiêu cải thiện điểm! 🎯</p>
          <p className='mt-0.5 text-muted-foreground text-xs'>
            GPA mục tiêu:{" "}
            <span className='font-bold text-emerald-600 dark:text-emerald-400'>{plannedGpa4.toFixed(fixedPoint)}</span>
            {plannedGpa4 > currentGpa4
              ? " — Cố gắng lên, bạn sắp đạt được rồi! 💪"
              : " — Hãy tiếp tục duy trì phong độ nhé!"}
          </p>
        </div>
        <Button
          className='shrink-0 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300'
          onClick={() => {
            window.location.hash = "score-plan";
          }}
          size='sm'
          variant='outline'
        >
          Xem ngay <ArrowRightIcon className='ml-1 h-3.5 w-3.5' />
        </Button>
      </div>
      <div className='-right-4 -bottom-4 absolute h-20 w-20 rounded-full bg-emerald-500/5' />
      <div className='-right-1 -bottom-1 absolute h-10 w-10 rounded-full bg-emerald-500/10' />
    </div>
  );
}
