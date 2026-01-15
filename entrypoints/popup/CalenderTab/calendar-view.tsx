import { vi } from "date-fns/locale";
import { useState } from "react";
import { DayButton } from "react-day-picker";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { CalendarDetail } from "./calendar-detail";
import type { SemesterData } from "./type";
import { useCalendarStore } from "./use-calendar-store";
import { getScheduleForDate } from "./utils/format";

type CalendarViewProps = {
  data: SemesterData[];
};

type CalendarDayButtonProps = React.ComponentProps<typeof DayButton>;

const CustomDayButton = (props: CalendarDayButtonProps) => {
  const { day } = props;
  const scheduleMap = useCalendarStore((state) => state.scheduleMap);
  const daySchedule = getScheduleForDate(day.date, scheduleMap);
  const hasEvents = daySchedule.length > 0;

  return (
    <CalendarDayButton {...props}>
      {props.children}
      {hasEvents && (
        <div className='flex items-center justify-center gap-[2px]'>
          {daySchedule.slice(0, 3).map((entry, index) => (
            <div className='h-1 w-1 rounded-full bg-orange-500' key={`${entry.code}-${entry.start_period}-${index}`} />
          ))}
        </div>
      )}
    </CalendarDayButton>
  );
};

const calendarComponents = {
  DayButton: CustomDayButton
};

export function CalendarView(_props: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const scheduleMap = useCalendarStore((state) => state.scheduleMap);

  const schedule = selectedDate ? getScheduleForDate(selectedDate, scheduleMap) : [];

  return (
    <div className='flex items-start justify-center gap-4 overflow-auto'>
      <div className='flex flex-col items-center justify-start'>
        <Calendar
          className='rounded-md border'
          components={calendarComponents}
          locale={vi}
          mode='single'
          onSelect={setSelectedDate}
          selected={selectedDate}
        />
      </div>
      <div className='min-w-0 flex-1'>
        <CalendarDetail schedule={schedule} selectedDate={selectedDate} />
      </div>
    </div>
  );
}
