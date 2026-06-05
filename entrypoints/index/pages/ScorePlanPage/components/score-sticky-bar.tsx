import { ArrowRightIcon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ScoreSummaryType } from "@/types";
import { formatVND, formatVNDCompact } from "@/utils/tuition-compute";

export function ScoreStickyBar({
  estimatedTuition,
  fixedPoint,
  hasUnsavedChanges,
  investedCredits,
  isModifiedFromOriginal,
  onCancelChanges,
  onRestoreOriginal,
  onSaveChanges,
  originalSummary,
  summary
}: {
  estimatedTuition: number | null;
  fixedPoint: number;
  hasUnsavedChanges: boolean;
  investedCredits: number;
  isModifiedFromOriginal: boolean;
  onCancelChanges: () => void;
  onRestoreOriginal: () => void;
  onSaveChanges: () => void;
  originalSummary: ScoreSummaryType | null;
  summary: ScoreSummaryType;
}) {
  if (!(originalSummary && (isModifiedFromOriginal || hasUnsavedChanges))) {
    return null;
  }

  return (
    <div className='sticky bottom-0 z-50'>
      <div className='mx-auto flex max-w-5xl items-center justify-between rounded-2xl border bg-background/90 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] backdrop-blur-md'>
        <div className='flex gap-6'>
          <div>
            <p className='font-medium text-muted-foreground text-sm'>GPA dự kiến</p>
            <div className='flex items-center gap-2 font-bold text-xl'>
              <span className='text-muted-foreground line-through'>{originalSummary.gpa4.toFixed(fixedPoint)}</span>
              <ArrowRightIcon className='h-5 w-5 text-muted-foreground' />
              <span className='text-primary'>{summary.gpa4.toFixed(fixedPoint)}</span>
            </div>
          </div>
          <div className='border-l pl-6'>
            <p className='font-medium text-muted-foreground text-sm'>Tín chỉ đầu tư</p>
            <p className='font-bold text-amber-500 text-xl'>+{investedCredits} TC</p>
          </div>
          {estimatedTuition !== null && (
            <div className='border-l pl-6'>
              <p className='flex items-center gap-1 font-medium text-muted-foreground text-sm'>
                Chi phí ước tính
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className='h-3 w-3 cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent side='top'>
                    <p className='max-w-56 text-xs'>
                      {investedCredits > 0
                        ? `Ước tính dựa trên đơn giá tín chỉ học kỳ gần nhất (${formatVNDCompact(estimatedTuition)}/TC)`
                        : `Chưa có tín chỉ cải thiện. Đơn giá tham khảo: ${formatVNDCompact(estimatedTuition)}/TC`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className='font-bold text-base text-blue-500'>~{formatVND(estimatedTuition * investedCredits)}</p>
            </div>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {hasUnsavedChanges ? (
            <>
              <Button onClick={onCancelChanges} size='sm' variant='outline'>
                Hủy sửa đổi
              </Button>
              <Button onClick={onSaveChanges} size='sm'>
                Lưu kế hoạch
              </Button>
            </>
          ) : (
            <Button
              className='text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30'
              onClick={onRestoreOriginal}
              size='sm'
              variant='outline'
            >
              Khôi phục bản gốc
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
