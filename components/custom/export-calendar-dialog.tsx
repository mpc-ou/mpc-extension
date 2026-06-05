import { CalendarPlusIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
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
import type { SemesterData } from "@/types";

type ExportCalendarDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarData: SemesterData[];
  onExport: (selectedSemesters: SemesterData[]) => void;
};

export function ExportCalendarDialog({ open, onOpenChange, calendarData, onExport }: ExportCalendarDialogProps) {
  const [selectedSemesters, setSelectedSemesters] = useState<Set<string>>(new Set());
  const [includeClass, setIncludeClass] = useState(true);
  const [includeExam, setIncludeExam] = useState(true);
  const classId = useId();
  const examId = useId();

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
    const selected = calendarData
      .filter((s) => selectedSemesters.has(s.semester))
      .map((semester) => {
        return {
          ...semester,
          weeks: semester.weeks
            .map((week) => ({
              ...week,
              schedule: week.schedule.filter((entry) => {
                const isExamEvent = entry.eventType === "EXAM" || entry.category === "EXAM";
                if (isExamEvent) {
                  return includeExam;
                }
                return includeClass;
              })
            }))
            .filter((week) => week.schedule.length > 0)
        };
      })
      .filter((semester) => semester.weeks.length > 0);
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

        <div className='flex gap-4 border-b pt-2 pb-4 text-sm'>
          <div className='flex items-center space-x-2'>
            <Checkbox checked={includeClass} id={classId} onCheckedChange={(c) => setIncludeClass(!!c)} />
            <Label className='cursor-pointer font-medium' htmlFor={classId}>
              Lịch học
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox checked={includeExam} id={examId} onCheckedChange={(c) => setIncludeExam(!!c)} />
            <Label className='cursor-pointer font-medium' htmlFor={examId}>
              Lịch thi
            </Label>
          </div>
        </div>

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
          <Button
            disabled={selectedSemesters.size === 0 || !(includeClass || includeExam)}
            onClick={handleExport}
            type='button'
          >
            Xuất {selectedSemesters.size > 0 ? `(${selectedSemesters.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
