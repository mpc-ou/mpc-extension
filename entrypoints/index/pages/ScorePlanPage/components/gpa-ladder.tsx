type GPALadderProps = {
  currentGpa: number;
  projectedGpa: number;
};

export function GPALadder({ currentGpa, projectedGpa }: GPALadderProps) {
  const roundedCurrent = Math.round(currentGpa * 100) / 100;
  const roundedProjected = Math.round(projectedGpa * 100) / 100;

  const getGpaCoords = (gpa: number) => {
    if (gpa <= 2.0) {
      return { x: 16, y: 88 };
    }
    if (gpa >= 4.0) {
      return { x: 96, y: 8 };
    }
    if (gpa < 2.5) {
      const t = (gpa - 2.0) / 0.5;
      return {
        x: 16 + t * 20,
        y: 88 - t * 14
      };
    }
    if (gpa < 3.2) {
      const t = (gpa - 2.5) / 0.7;
      return {
        x: 36 + t * 24,
        y: 74 - t * 27
      };
    }
    if (gpa < 3.6) {
      const t = (gpa - 3.2) / 0.4;
      return {
        x: 60 + t * 26,
        y: 47 - t * 27
      };
    }
    const t = (gpa - 3.6) / 0.4;
    return {
      x: 86 + t * 10,
      y: 20 - t * 12
    };
  };

  const cCoords = getGpaCoords(roundedCurrent);
  const pCoords = getGpaCoords(roundedProjected);

  const getAdjustedCoords = () => {
    const p1 = { ...cCoords };
    const p2 = { ...pCoords };

    const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    if (dist < 8 && roundedProjected > roundedCurrent) {
      p1.x -= 4;
      p2.x += 4;
    }
    return { p1, p2 };
  };

  const { p1, p2 } = getAdjustedCoords();

  return (
    <div className='relative h-48 w-full overflow-hidden rounded-xl border bg-muted/10 p-4 shadow-inner'>
      <svg className='pointer-events-none absolute inset-0 h-full w-full'>
        <title>Đường nối GPA</title>
        <defs>
          <linearGradient id='gpa-path-grad' x1='0%' x2='100%' y1='0%' y2='100%'>
            <stop offset='0%' stopColor='#3b82f6' stopOpacity='0.8' />
            <stop offset='100%' stopColor='#eab308' stopOpacity='0.8' />
          </linearGradient>
          <filter id='gpa-glow'>
            <feGaussianBlur result='coloredBlur' stdDeviation='1.5' />
            <feMerge>
              <feMergeNode in='coloredBlur' />
              <feMergeNode in='SourceGraphic' />
            </feMerge>
          </filter>
        </defs>

        <line
          className='text-muted-foreground/20'
          stroke='currentColor'
          strokeDasharray='2 3'
          strokeWidth='1'
          x1='10%'
          x2='96%'
          y1='74%'
          y2='74%'
        />
        <line
          className='text-muted-foreground/20'
          stroke='currentColor'
          strokeDasharray='2 3'
          strokeWidth='1'
          x1='10%'
          x2='96%'
          y1='47%'
          y2='47%'
        />
        <line
          className='text-muted-foreground/20'
          stroke='currentColor'
          strokeDasharray='2 3'
          strokeWidth='1'
          x1='10%'
          x2='96%'
          y1='20%'
          y2='20%'
        />

        <line
          className='text-muted-foreground/25'
          stroke='currentColor'
          strokeDasharray='3 3'
          strokeWidth='1.5'
          x1='16%'
          x2='36%'
          y1='88%'
          y2='74%'
        />
        <line
          className='text-muted-foreground/25'
          stroke='currentColor'
          strokeDasharray='3 3'
          strokeWidth='1.5'
          x1='36%'
          x2='60%'
          y1='74%'
          y2='47%'
        />
        <line
          className='text-muted-foreground/25'
          stroke='currentColor'
          strokeDasharray='3 3'
          strokeWidth='1.5'
          x1='60%'
          x2='86%'
          y1='47%'
          y2='20%'
        />
        <line
          className='text-muted-foreground/25'
          stroke='currentColor'
          strokeDasharray='3 3'
          strokeWidth='1.5'
          x1='86%'
          x2='96%'
          y1='20%'
          y2='8%'
        />

        {roundedProjected > roundedCurrent && (
          <line
            className='gpa-dash-line'
            fill='none'
            filter='url(#gpa-glow)'
            stroke='url(#gpa-path-grad)'
            strokeDasharray='5 4'
            strokeLinecap='round'
            strokeWidth='3.5'
            x1={`${p1.x}%`}
            x2={`${p2.x}%`}
            y1={`${p1.y}%`}
            y2={`${p2.y}%`}
          />
        )}
      </svg>

      <style>{`
        @keyframes gpaDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .gpa-dash-line {
          animation: gpaDash 1.2s linear infinite;
        }
      `}</style>

      <div
        className='-translate-y-1/2 pointer-events-none absolute left-3 flex items-center gap-1 font-bold text-[9px] text-amber-500 uppercase tracking-wider'
        style={{ top: "20%" }}
      >
        🏆 Xuất sắc (3.6)
      </div>

      <div
        className='-translate-y-1/2 pointer-events-none absolute left-3 flex items-center gap-1 font-bold text-[9px] text-blue-500 uppercase tracking-wider'
        style={{ top: "47%" }}
      >
        ⭐ Giỏi (3.2)
      </div>

      <div
        className='-translate-y-1/2 pointer-events-none absolute left-3 flex items-center gap-1 font-bold text-[9px] text-emerald-600 uppercase tracking-wider dark:text-emerald-400'
        style={{ top: "74%" }}
      >
        👍 Khá (2.5)
      </div>

      <div
        className='-translate-x-1/2 -translate-y-1/2 absolute z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-500 font-bold text-white text-xs shadow-md transition-all duration-500 hover:scale-110'
        style={{ left: `${p1.x}%`, top: `${p1.y}%` }}
        title={`GPA Hiện tại: ${currentGpa.toFixed(2)}`}
      >
        <span className='font-bold font-serif text-[10px]'>{currentGpa.toFixed(2)}</span>
        <span className='-top-5.5 absolute whitespace-nowrap rounded bg-blue-600 px-1 font-bold text-[8px] text-white shadow-sm'>
          Hiện tại
        </span>
      </div>

      {roundedProjected > roundedCurrent && (
        <div
          className='-translate-x-1/2 -translate-y-1/2 absolute z-10 flex h-9.5 w-9.5 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-yellow-500 font-bold text-sm text-white shadow-lg transition-all duration-500 hover:scale-110'
          style={{ left: `${p2.x}%`, top: `${p2.y}%` }}
          title={`GPA Dự kiến: ${projectedGpa.toFixed(2)}`}
        >
          <span className='font-bold font-serif text-[11px]'>{projectedGpa.toFixed(2)}</span>
          <span className='-bottom-5.5 absolute whitespace-nowrap rounded bg-amber-500 px-1 font-bold text-[8px] text-white shadow-sm'>
            Dự kiến
          </span>
        </div>
      )}
    </div>
  );
}
