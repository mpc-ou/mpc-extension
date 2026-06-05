import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { _DEFAULT_GRADE_COLORS } from "@/constants/default";
import { cn } from "@/lib/utils";

const GRADE_SEGMENTS = [
  { label: "F", scale4: "0.0", min10: 0, max10: 4 },
  { label: "D", scale4: "1.0", min10: 4, max10: 5 },
  { label: "D+", scale4: "1.5", min10: 5, max10: 5.5 },
  { label: "C", scale4: "2.0", min10: 5.5, max10: 6.5 },
  { label: "C+", scale4: "2.5", min10: 6.5, max10: 7 },
  { label: "B", scale4: "3.0", min10: 7, max10: 8 },
  { label: "B+", scale4: "3.5", min10: 8, max10: 8.5 },
  { label: "A", scale4: "4.0", min10: 8.5, max10: 9 },
  { label: "A+", scale4: "4.0", min10: 9, max10: 10 }
] as const;

const ALL_GRADES = new Set(GRADE_SEGMENTS.map((s) => s.label));
const MIN10 = 0;
const MAX10 = 10;

type FilterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedGrades: Set<string>;
  onFilterChange: (grades: Set<string>) => void;
  showNonStandard: boolean;
  onToggleShowNonStandard: (v: boolean) => void;
};

export function FilterModal({
  open,
  onOpenChange,
  selectedGrades,
  onFilterChange,
  showNonStandard,
  onToggleShowNonStandard
}: FilterModalProps) {
  const handleToggle = (label: string) => {
    const next = new Set(selectedGrades);
    if (next.has(label)) {
      next.delete(label);
    } else {
      next.add(label);
    }
    onFilterChange(next);
  };

  const handleSelectAll = () => onFilterChange(new Set(ALL_GRADES));
  const handleClearAll = () => onFilterChange(new Set());

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Lọc theo xếp loại</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='mx-auto w-full max-w-md space-y-1.5'>
            <div className='relative flex h-12 overflow-hidden rounded-lg'>
              {GRADE_SEGMENTS.map((seg) => {
                const isSelected = selectedGrades.has(seg.label);
                return (
                  <button
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center transition-all duration-150",
                      isSelected ? "ring-1 ring-white/30 ring-inset" : "opacity-30 grayscale-[70%] hover:opacity-50"
                    )}
                    key={seg.label}
                    onClick={() => handleToggle(seg.label)}
                    style={{
                      backgroundColor: _DEFAULT_GRADE_COLORS[seg.label],
                      width: `${((seg.max10 - seg.min10) / (MAX10 - MIN10)) * 100}%`
                    }}
                    type='button'
                  >
                    <span className='font-bold text-white text-xs leading-tight drop-shadow-sm'>{seg.label}</span>
                    <span className='text-[10px] text-white/75 leading-tight'>({seg.scale4})</span>
                  </button>
                );
              })}
            </div>
            <div className='relative flex h-5'>
              {GRADE_SEGMENTS.map((seg, i) => (
                <div
                  className='relative'
                  key={`tick-${seg.label}`}
                  style={{ width: `${((seg.max10 - seg.min10) / (MAX10 - MIN10)) * 100}%` }}
                >
                  <span className='-left-1 absolute text-[10px] text-muted-foreground leading-none'>{seg.min10}</span>
                  {i === GRADE_SEGMENTS.length - 1 && (
                    <span className='-right-1 absolute text-[10px] text-muted-foreground leading-none'>
                      {seg.max10}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className='flex w-full items-center justify-between sm:justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex gap-2'>
              <Button onClick={handleSelectAll} size='sm' variant='ghost'>
                Chọn hết
              </Button>
              <Button onClick={handleClearAll} size='sm' variant='ghost'>
                Bỏ hết
              </Button>
            </div>
            <div className='flex cursor-pointer items-center gap-1.5 text-muted-foreground text-sm'>
              <Checkbox
                checked={showNonStandard}
                id='show-non-standard'
                onCheckedChange={(v) => onToggleShowNonStandard(!!v)}
              />
              <label className='cursor-pointer' htmlFor='show-non-standard'>
                Môn không theo thang GPA
              </label>
            </div>
          </div>
          <Button onClick={() => onOpenChange(false)} size='sm' variant='secondary'>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
