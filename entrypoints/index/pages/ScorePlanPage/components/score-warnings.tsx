import { getDrlWarnings } from "@/utils/academic-compute";

type DrlWarnings = ReturnType<typeof getDrlWarnings>;

export function ScoreWarnings({ warnings }: { warnings: DrlWarnings }) {
  if (!warnings.isAtRisk) {
    return null;
  }

  return (
    <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3'>
      <p className='font-medium text-destructive text-sm'>⚠ Cảnh báo học vụ</p>
      <p className='mt-1 text-muted-foreground text-xs'>
        Bạn có {warnings.consecutiveCount} học kì liên tiếp ĐRL dưới 50. Nếu thêm 1 kì nữa, MSSV có thể bị khóa.
      </p>
    </div>
  );
}
