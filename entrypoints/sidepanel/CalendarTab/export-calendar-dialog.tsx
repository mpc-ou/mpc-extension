import { CalendarPlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SemesterData } from "./type";

type ExportCalendarDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarData: SemesterData[];
  onExport: (selectedSemesters: SemesterData[]) => void;
};

export function ExportCalendarDialog({ open, onOpenChange, calendarData, onExport }: ExportCalendarDialogProps) {
  const [selectedSemesters, setSelectedSemesters] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && calendarData.length > 0) {
      const latestSemester = calendarData.at(-1)?.semester;
      if (latestSemester) {
        setSelectedSemesters(new Set([latestSemester]));
      }
    }
  }, [open, calendarData]);

  const handleToggle = (semester: string) => {
    const newSelected = new Set(selectedSemesters);
    if (newSelected.has(semester)) {
      newSelected.delete(semester);
    } else {
      newSelected.add(semester);
    }
    setSelectedSemesters(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSemesters.size === calendarData.length) {
      setSelectedSemesters(new Set());
    } else {
      setSelectedSemesters(new Set(calendarData.map((s) => s.semester)));
    }
  };

  const handleExport = () => {
    const selected = calendarData.filter((s) => selectedSemesters.has(s.semester));
    onExport(selected);
    onOpenChange(false);
  };

  const getTotalEvents = (semesters: SemesterData[]) =>
    semesters.reduce(
      (total, semester) => total + semester.weeks.reduce((acc, week) => acc + week.schedule.length, 0),
      0
    );

  const selectedData = calendarData.filter((s) => selectedSemesters.has(s.semester));
  const totalEvents = getTotalEvents(selectedData);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <CalendarPlusIcon className='h-5 w-5' />
            Xuất Google Calendar
          </DialogTitle>
          <DialogDescription>Chọn các học kỳ bạn muốn xuất sang Google Calendar</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Button onClick={handleSelectAll} size='sm' type='button' variant='outline'>
              {selectedSemesters.size === calendarData.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </Button>
            {selectedSemesters.size > 0 && (
              <span className='text-muted-foreground text-sm'>
                {selectedSemesters.size} học kỳ · {totalEvents} sự kiện
              </span>
            )}
          </div>

          <ScrollArea className='h-[300px] rounded-md border p-4'>
            <div className='space-y-3'>
              {calendarData.map((semester) => {
                const isSelected = selectedSemesters.has(semester.semester);
                const eventCount = getTotalEvents([semester]);

                return (
                  <div
                    className='flex items-start space-x-3 rounded-lg border p-3 transition-colors hover:bg-accent'
                    key={semester.semester}
                  >
                    <Checkbox
                      checked={isSelected}
                      id={semester.semester}
                      onCheckedChange={() => handleToggle(semester.semester)}
                    />
                    <div className='flex-1 space-y-1'>
                      <Label className='cursor-pointer font-medium text-sm leading-none' htmlFor={semester.semester}>
                        {semester.semester}
                      </Label>
                      <p className='text-muted-foreground text-xs'>
                        {semester.weeks.length} tuần · {eventCount} sự kiện
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type='button' variant='outline'>
            Hủy
          </Button>
          <Button disabled={selectedSemesters.size === 0} onClick={handleExport} type='button'>
            Xuất {selectedSemesters.size > 0 ? `(${selectedSemesters.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
