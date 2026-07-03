import { GitFork } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ScoreGroupType, ScoreRecordType } from "@/types";

type LinkImprovementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: ScoreRecordType | null;
  data: ScoreGroupType[];
  handleLinkImprovement?: (newSubId: string, oldSubId: string | null) => void;
};

export function LinkImprovementDialog({
  open,
  onOpenChange,
  subject,
  data,
  handleLinkImprovement
}: LinkImprovementDialogProps) {
  const [selectedTargetSubId, setSelectedTargetSubId] = useState<string | null>(null);

  useEffect(() => {
    if (subject) {
      setSelectedTargetSubId(subject.improvesSubjectId || null);
    } else {
      setSelectedTargetSubId(null);
    }
  }, [subject]);

  if (!subject) {
    return null;
  }

  const newSubSemIdx = data.findIndex((sem) => sem.data.some((s) => s.id === subject.id));

  let currentlyLinkedSub: ScoreRecordType | null = null;
  let currentlyLinkedSemTitle = "";
  if (subject.improvesSubjectId) {
    for (const sem of data) {
      const found = sem.data.find((s) => s.id === subject.improvesSubjectId);
      if (found) {
        currentlyLinkedSub = found;
        currentlyLinkedSemTitle = sem.title;
        break;
      }
    }
  }

  const groups: { title: string; data: ScoreRecordType[] }[] = data
    .map((sem, semIdx) => {
      if (semIdx < newSubSemIdx) {
        return { title: sem.title, data: [] };
      }
      return {
        title: sem.title,
        data: sem.data.filter((sub) => {
          if (sub.id === subject.id) {
            return false;
          }
          if (currentlyLinkedSub && sub.id === currentlyLinkedSub.id) {
            return false;
          }
          if (sub.point.character === "M") {
            return false;
          }
          if (sub.isIgnore && !sub.isImproved) {
            return false;
          }
          return true;
        })
      };
    })
    .filter((sem) => sem.data.length > 0);

  return (
    <Dialog
      onOpenChange={(openVal) => {
        if (!openVal) {
          onOpenChange(false);
          setSelectedTargetSubId(null);
        }
      }}
      open={open}
    >
      <DialogContent className='flex max-h-[85vh] flex-col sm:max-w-160'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <GitFork className='h-5 w-5 text-amber-500' />
            Thiết lập liên kết cải thiện môn học
          </DialogTitle>
          <DialogDescription>
            Liên kết môn <strong>{subject.name}</strong> ({subject.credit} TC, {subject.point.scale10} điểm) thay thế
            cho môn cũ nào dưới đây?
            <p className='text-muted-foreground italic'>
              Tính năng dùng để cải thiện điểm số môn học thủ công nếu hệ thống chưa nhận diện đúng.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className='my-4 flex-1 space-y-4 overflow-y-auto pr-1'>
          {/* Pinned currently linked subject */}
          {currentlyLinkedSub && (
            <div className='space-y-2'>
              <h4 className='rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-bold text-emerald-600 text-xs uppercase tracking-wider dark:text-emerald-400'>
                📌 Môn học đang liên kết cải thiện
              </h4>
              <div className='grid w-full gap-1'>
                <button
                  className={cn(
                    "flex w-full flex-nowrap items-center justify-between overflow-hidden rounded border p-2 text-left text-xs transition-all",
                    selectedTargetSubId === currentlyLinkedSub.id
                      ? "border-emerald-500 bg-emerald-500/10 font-medium"
                      : "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                  )}
                  onClick={() => setSelectedTargetSubId(currentlyLinkedSub?.id || null)}
                  type='button'
                >
                  <div className='min-w-0 flex-1 overflow-hidden pr-4'>
                    <span className='block font-mono text-[10px] text-muted-foreground'>
                      {currentlyLinkedSub.code} · {currentlyLinkedSemTitle}
                    </span>
                    <span className='block w-full truncate font-medium'>{currentlyLinkedSub.name}</span>
                  </div>
                  <div className='flex shrink-0 items-center gap-4'>
                    <span className='text-muted-foreground'>{currentlyLinkedSub.credit} TC</span>
                    <span className='w-12 text-right font-bold'>Hệ 10: {currentlyLinkedSub.point.scale10}</span>
                    <span className='rounded bg-emerald-500/15 px-1.5 py-0.5 font-bold text-[9px] text-emerald-600 dark:text-emerald-400'>
                      Đang liên kết
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {groups.length === 0 ? (
            <p className='py-6 text-center text-muted-foreground text-sm'>
              Không tìm thấy môn học khác (GD/chưa qua môn/GDTC...) hợp lệ để liên kết.
            </p>
          ) : (
            groups.map((group) => (
              <div className='space-y-2' key={group.title}>
                <h4 className='rounded bg-muted/40 px-2 py-1 font-bold text-muted-foreground text-xs uppercase tracking-wider'>
                  {group.title}
                </h4>
                <div className='grid w-full gap-1'>
                  {group.data.map((sub) => {
                    const isSelected = selectedTargetSubId === sub.id;
                    return (
                      <button
                        className={cn(
                          "flex w-full flex-nowrap items-center justify-between overflow-hidden rounded border p-2 text-left text-xs transition-all",
                          isSelected
                            ? "border-amber-500 bg-amber-500/5 font-medium"
                            : "border-transparent hover:bg-muted/50"
                        )}
                        key={sub.id}
                        onClick={() => setSelectedTargetSubId(sub.id || null)}
                        type='button'
                      >
                        <div className='min-w-0 flex-1 overflow-hidden pr-4'>
                          <span className='block font-mono text-[10px] text-muted-foreground'>{sub.code}</span>
                          <span className='block w-full truncate font-medium'>{sub.name}</span>
                        </div>
                        <div className='flex shrink-0 items-center gap-4'>
                          <span className='text-muted-foreground'>{sub.credit} TC</span>
                          <span className='w-12 text-right font-bold'>Hệ 10: {sub.point.scale10}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className='flex shrink-0 items-center justify-between sm:justify-between'>
          <div>
            {subject.improvesSubjectId && (
              <Button
                onClick={() => {
                  handleLinkImprovement?.(subject.id || "", null);
                  onOpenChange(false);
                  setSelectedTargetSubId(null);
                }}
                size='sm'
                variant='destructive'
              >
                Hủy liên kết hiện tại
              </Button>
            )}
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={() => {
                onOpenChange(false);
                setSelectedTargetSubId(null);
              }}
              size='sm'
              variant='outline'
            >
              Hủy
            </Button>
            <Button
              disabled={!selectedTargetSubId}
              onClick={() => {
                if (selectedTargetSubId) {
                  handleLinkImprovement?.(subject.id || "", selectedTargetSubId);
                  onOpenChange(false);
                  setSelectedTargetSubId(null);
                }
              }}
              size='sm'
            >
              Xác nhận liên kết
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
