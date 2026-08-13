type ProgressTimelineProps = {
  currentCredits: number;
  totalCredits: number;
};

export function ProgressTimeline({ currentCredits, totalCredits }: ProgressTimelineProps) {
  const percent = Math.min(100, Math.max(0, totalCredits > 0 ? (currentCredits / totalCredits) * 100 : 0));

  return (
    <div className='space-y-4 rounded-xl border bg-muted/10 p-4 shadow-sm'>
      <div className='flex items-center justify-between text-xs'>
        <span className='font-bold text-[10px] text-muted-foreground uppercase tracking-wider'>
          📅 Tiến độ tích lũy tín chỉ
        </span>
        <span className='rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-[10px] text-emerald-600 dark:text-emerald-400'>
          Hoàn thành {percent.toFixed(0)}%
        </span>
      </div>

      <div className='relative h-3 w-full overflow-hidden rounded-full bg-muted dark:bg-muted/40'>
        <div
          className='h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm transition-all duration-500'
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className='grid grid-cols-3 pt-1 font-medium text-[11px] text-muted-foreground'>
        <div className='text-left'>
          <p className='text-[9px] text-muted-foreground/60 uppercase tracking-wider'>Khởi đầu</p>
          <p className='mt-0.5 font-bold font-mono text-foreground'>0 TC</p>
        </div>
        <div className='text-center'>
          <p className='text-[9px] text-muted-foreground/60 uppercase tracking-wider'>Đã học</p>
          <p className='mt-0.5 font-bold font-mono text-emerald-600 dark:text-emerald-400'>{currentCredits} TC</p>
        </div>
        <div className='text-right'>
          <p className='text-[9px] text-muted-foreground/60 uppercase tracking-wider'>Mục tiêu</p>
          <p className='mt-0.5 font-bold font-mono text-foreground'>{totalCredits} TC</p>
        </div>
      </div>
    </div>
  );
}
