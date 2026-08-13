import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { ScoreRecordType } from "@/types";

type ImprovementDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pair: {
    oldSub: ScoreRecordType;
    oldSem: string;
    newSub: ScoreRecordType;
    newSem: string;
  } | null;
};

export function ImprovementDetailsDialog({ open, onOpenChange, pair }: ImprovementDetailsDialogProps) {
  if (!pair) {
    return null;
  }

  const { oldSub, oldSem, newSub, newSem } = pair;
  const diff10 = (newSub.point.scale10 ?? 0) - (oldSub.point.scale10 ?? 0);
  const diff4 = (newSub.point.scale4 ?? 0) - (oldSub.point.scale4 ?? 0);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className='sm:max-w-160'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5 text-emerald-500' />
            Chi tiết cải thiện điểm số
          </DialogTitle>
          <DialogDescription>So sánh điểm số trước và sau khi học cải thiện.</DialogDescription>
        </DialogHeader>

        <div className='relative grid grid-cols-1 gap-4 py-4 sm:grid-cols-2'>
          <div className='-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 hidden h-8 w-8 items-center justify-center rounded-full border bg-muted font-bold text-muted-foreground text-sm shadow-sm sm:flex'>
            ➔
          </div>

          <div className='space-y-3 rounded-xl border bg-muted/20 p-4'>
            <div className='border-muted border-b pb-2 text-center'>
              <span className='block font-bold text-[10px] text-muted-foreground uppercase tracking-widest'>
                Môn học gốc
              </span>
              <span className='font-medium text-muted-foreground text-xs'>{oldSem}</span>
            </div>
            <div className='space-y-1'>
              <p className='font-mono text-[10px] text-muted-foreground'>{oldSub.code}</p>
              <h4 className='min-h-8 font-bold text-sm leading-tight'>{oldSub.name}</h4>
              <p className='text-muted-foreground text-xs'>{oldSub.credit} tín chỉ</p>
            </div>
            <div className='grid grid-cols-3 gap-1 pt-2 text-center'>
              <div className='rounded bg-muted p-1'>
                <span className='block text-[9px] text-muted-foreground uppercase'>Hệ 10</span>
                <span className='font-bold font-mono text-sm'>{oldSub.point.scale10}</span>
              </div>
              <div className='rounded bg-muted p-1'>
                <span className='block text-[9px] text-muted-foreground uppercase'>Hệ 4</span>
                <span className='font-bold font-mono text-sm'>{oldSub.point.scale4}</span>
              </div>
              <div className='rounded bg-muted p-1'>
                <span className='block text-[9px] text-muted-foreground uppercase'>Loại</span>
                <span className='font-bold text-red-500 text-sm dark:text-red-400'>{oldSub.point.character}</span>
              </div>
            </div>
          </div>

          <div className='space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4'>
            <div className='border-emerald-500/10 border-b pb-2 text-center'>
              <span className='block font-bold text-[10px] text-emerald-600 uppercase tracking-widest dark:text-emerald-400'>
                Môn cải thiện
              </span>
              <span className='font-medium text-emerald-600 text-xs dark:text-emerald-400'>{newSem}</span>
            </div>
            <div className='space-y-1'>
              <p className='font-mono text-[10px] text-muted-foreground'>{newSub.code}</p>
              <h4 className='min-h-8 font-bold text-sm leading-tight'>{newSub.name}</h4>
              <p className='text-muted-foreground text-xs'>{newSub.credit} tín chỉ</p>
            </div>
            <div className='grid grid-cols-3 gap-1 pt-2 text-center'>
              <div className='rounded bg-emerald-500/10 p-1'>
                <span className='block text-[9px] text-emerald-600 uppercase dark:text-emerald-400'>Hệ 10</span>
                <span className='font-bold font-mono text-emerald-600 text-sm dark:text-emerald-400'>
                  {newSub.point.scale10}
                </span>
              </div>
              <div className='rounded bg-emerald-500/10 p-1'>
                <span className='block text-[9px] text-emerald-600 uppercase dark:text-emerald-400'>Hệ 4</span>
                <span className='font-bold font-mono text-emerald-600 text-sm dark:text-emerald-400'>
                  {newSub.point.scale4}
                </span>
              </div>
              <div className='rounded bg-emerald-500/10 p-1'>
                <span className='block text-[9px] text-emerald-600 uppercase dark:text-emerald-400'>Loại</span>
                <span className='font-bold text-emerald-600 text-sm dark:text-emerald-400'>
                  {newSub.point.character}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center'>
          <span className='block font-medium text-emerald-700 text-xs dark:text-emerald-300'>
            Kết quả cải thiện điểm số
          </span>
          <div className='mt-1.5 flex justify-center gap-8 font-bold font-mono text-emerald-600 text-sm dark:text-emerald-400'>
            <div>
              Hệ 10: <span className='text-lg'>+{diff10.toFixed(2)}</span>
            </div>
            <div>
              Hệ 4: <span className='text-lg'>+{diff4.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className='mt-4'>
          <Button className='w-full sm:w-auto' onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
