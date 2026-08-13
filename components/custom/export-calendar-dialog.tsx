import { CalendarPlusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SemesterData } from "@/types";
import { parseSemesterName } from "@/utils/calendar-format";
import type { ICSExportOptions, ICSReminderAction, ICSReminderUnit } from "@/utils/ics-utils";

const MAX_REMINDERS = 5;

type ExportCalendarDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarData: SemesterData[];
  studentId?: string;
  onExport: (selectedSemesters: SemesterData[], options: ICSExportOptions) => void;
};

type ReminderForm = {
  id: string;
  amount: string;
  unit: ICSReminderUnit;
  action: ICSReminderAction;
};

function createReminderForm(): ReminderForm {
  return {
    id: `${Date.now()}-${Math.random()}`,
    amount: "30",
    unit: "minutes",
    action: "DISPLAY"
  };
}

export function ExportCalendarDialog({
  open,
  onOpenChange,
  calendarData,
  studentId,
  onExport
}: ExportCalendarDialogProps) {
  const [selectedSemesters, setSelectedSemesters] = useState<Set<string>>(new Set());
  const [includeClass, setIncludeClass] = useState(true);
  const [includeExam, setIncludeExam] = useState(true);
  const [includeReminder, setIncludeReminder] = useState(false);
  const [reminders, setReminders] = useState<ReminderForm[]>(() => [createReminderForm()]);
  const classId = useId();
  const examId = useId();
  const reminderId = useId();

  const sortedCalendarData = useMemo(() => {
    return [...calendarData].sort((a, b) => {
      const semesterA = parseSemesterName(a.semester);
      const semesterB = parseSemesterName(b.semester);
      if (semesterA && semesterB) {
        if (semesterA.startYear !== semesterB.startYear) {
          return semesterB.startYear - semesterA.startYear;
        }
        return semesterB.num - semesterA.num;
      }
      if (semesterA) {
        return -1;
      }
      if (semesterB) {
        return 1;
      }
      return a.semester.localeCompare(b.semester);
    });
  }, [calendarData]);

  useEffect(() => {
    if (open && sortedCalendarData.length > 0) {
      const latestSemester = sortedCalendarData[0]?.semester;
      if (latestSemester) {
        setSelectedSemesters(new Set([latestSemester]));
      }
    }
  }, [open, sortedCalendarData]);

  const handleToggle = (semester: string) => {
    const newSelected = new Set(selectedSemesters);
    if (newSelected.has(semester)) {
      newSelected.delete(semester);
    } else {
      newSelected.add(semester);
    }
    setSelectedSemesters(newSelected);
  };

  const updateReminder = (id: string, patch: Partial<Omit<ReminderForm, "id">>) => {
    setReminders((currentReminders) =>
      currentReminders.map((reminder) => (reminder.id === id ? { ...reminder, ...patch } : reminder))
    );
  };

  const handleAddReminder = () => {
    setReminders((currentReminders) =>
      currentReminders.length >= MAX_REMINDERS ? currentReminders : [...currentReminders, createReminderForm()]
    );
  };

  const handleRemoveReminder = (id: string) => {
    setReminders((currentReminders) => currentReminders.filter((reminder) => reminder.id !== id));
  };

  const handleSelectAll = () => {
    if (selectedSemesters.size === sortedCalendarData.length) {
      setSelectedSemesters(new Set());
    } else {
      setSelectedSemesters(new Set(sortedCalendarData.map((s) => s.semester)));
    }
  };

  const handleExport = () => {
    const selected = sortedCalendarData
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

    onExport(selected, {
      calendarName: `Lịch học OU - ${studentId || "MPC"}`,
      reminders: includeReminder
        ? reminders.map((reminder) => ({
            enabled: true,
            amount: Number.parseInt(reminder.amount, 10),
            unit: reminder.unit,
            action: reminder.action
          }))
        : []
    });
    onOpenChange(false);
  };

  const getTotalEvents = (semesters: SemesterData[]) =>
    semesters.reduce(
      (total, semester) => total + semester.weeks.reduce((acc, week) => acc + week.schedule.length, 0),
      0
    );

  const selectedData = sortedCalendarData.filter((s) => selectedSemesters.has(s.semester));
  const totalEvents = getTotalEvents(selectedData);
  const isReminderInvalid =
    includeReminder &&
    (reminders.length === 0 ||
      reminders.some((reminder) => {
        const parsedAmount = Number.parseInt(reminder.amount, 10);
        return !Number.isFinite(parsedAmount) || parsedAmount < 1;
      }));

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className='max-w-lg'>
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

        <div className='space-y-3 rounded-lg border p-3'>
          <div className='flex items-center space-x-2'>
            <Checkbox checked={includeReminder} id={reminderId} onCheckedChange={(c) => setIncludeReminder(!!c)} />
            <Label className='cursor-pointer font-medium' htmlFor={reminderId}>
              Đặt thời gian nhắc
            </Label>
          </div>

          {includeReminder && (
            <div className='space-y-3'>
              <div className='space-y-2'>
                {reminders.map((reminder, index) => (
                  <div className='grid items-end gap-2 sm:grid-cols-[80px_1fr_1fr_auto]' key={reminder.id}>
                    <div className='space-y-1.5'>
                      <Label className='text-xs' htmlFor={`calendar-reminder-amount-${reminder.id}`}>
                        Số
                      </Label>
                      <Input
                        id={`calendar-reminder-amount-${reminder.id}`}
                        min={1}
                        onChange={(e) => updateReminder(reminder.id, { amount: e.target.value })}
                        type='number'
                        value={reminder.amount}
                      />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Đơn vị</Label>
                      <Select
                        onValueChange={(v) => updateReminder(reminder.id, { unit: v as ICSReminderUnit })}
                        value={reminder.unit}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='minutes'>Phút</SelectItem>
                          <SelectItem value='hours'>Giờ</SelectItem>
                          <SelectItem value='days'>Ngày</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Hình thức</Label>
                      <Select
                        onValueChange={(v) => updateReminder(reminder.id, { action: v as ICSReminderAction })}
                        value={reminder.action}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='DISPLAY'>Qua app</SelectItem>
                          <SelectItem value='EMAIL'>Qua email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      aria-label={`Xóa nhắc lần ${index + 1}`}
                      disabled={reminders.length === 1}
                      onClick={() => handleRemoveReminder(reminder.id)}
                      size='icon'
                      type='button'
                      variant='ghost'
                    >
                      <Trash2Icon className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                disabled={reminders.length >= MAX_REMINDERS}
                onClick={handleAddReminder}
                size='sm'
                type='button'
                variant='outline'
              >
                <PlusIcon className='h-4 w-4' />
                Thêm nhắc
              </Button>
            </div>
          )}
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Button onClick={handleSelectAll} size='sm' type='button' variant='outline'>
              {selectedSemesters.size === sortedCalendarData.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </Button>
            {selectedSemesters.size > 0 && (
              <span className='text-muted-foreground text-sm'>
                {selectedSemesters.size} học kỳ · {totalEvents} sự kiện
              </span>
            )}
          </div>

          <ScrollArea className='h-[300px] rounded-md border p-4'>
            <div className='space-y-3'>
              {sortedCalendarData.map((semester) => {
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
            disabled={selectedSemesters.size === 0 || !(includeClass || includeExam) || isReminderInvalid}
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
