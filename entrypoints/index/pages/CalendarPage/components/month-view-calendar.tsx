import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CalendarEntry } from "@/types";
import { getSubjectHexColor } from "@/utils/calendar-format";
import { DayEventsModal } from "./day-events-modal";

type MonthViewCalendarProps = {
  scheduleMap: Map<string, CalendarEntry[]>;
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Generate a range of years: from min year in schedule data to current year + 1. */
function useYearOptions(scheduleMap: Map<string, CalendarEntry[]>): number[] {
  return useMemo(() => {
    let minYear = new Date().getFullYear();
    let maxYear = minYear;
    for (const dateKey of scheduleMap.keys()) {
      const y = Number.parseInt(dateKey.split("-")[0], 10);
      if (!Number.isNaN(y)) {
        if (y < minYear) {
          minYear = y;
        }
        if (y > maxYear) {
          maxYear = y;
        }
      }
    }
    const now = new Date().getFullYear();
    if (minYear > now) {
      minYear = now;
    }
    if (maxYear < now + 1) {
      maxYear = now + 1;
    }
    const years: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      years.push(y);
    }
    return years;
  }, [scheduleMap]);
}

export function MonthViewCalendar({ scheduleMap }: MonthViewCalendarProps) {
  const yearOptions = useYearOptions(scheduleMap);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToYear = (year: string) => setCurrentDate(setYear(currentDate, Number.parseInt(year, 10)));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  while (days.length < 42) {
    // biome-ignore lint/style/useAtIndex: using at(-1) requires non-null assertion which biome also complains about sometimes, but let's just use it safely
    const lastDay = days[days.length - 1];
    days.push(addDays(lastDay, 1));
  }

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsModalOpen(true);
  };

  const getEventsForDay = (day: Date) => {
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, "0");
    const d = String(day.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${d}`;
    return scheduleMap.get(dateKey) || [];
  };

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className='flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow'>
      <div className='flex items-center justify-between border-b px-6 py-4'>
        <h2 className='font-semibold text-lg capitalize'>{format(currentDate, "MMMM, yyyy", { locale: vi })}</h2>
        <div className='flex items-center gap-2'>
          <Button onClick={() => setCurrentDate(new Date())} size='sm' variant='outline'>
            Hôm nay
          </Button>
          <Select onValueChange={goToYear} value={String(currentDate.getFullYear())}>
            <SelectTrigger className='h-8 w-24 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className='flex items-center gap-1'>
            <Button className='h-8 w-8' onClick={prevMonth} size='icon' variant='ghost'>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button className='h-8 w-8' onClick={nextMonth} size='icon' variant='ghost'>
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-7 border-b bg-muted/50'>
        {WEEKDAYS.map((day) => (
          <div className='py-2 text-center font-medium text-muted-foreground text-sm' key={day}>
            {day}
          </div>
        ))}
      </div>

      <div className='grid flex-1 grid-cols-7 grid-rows-6 lg:grid-rows-auto'>
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const events = getEventsForDay(day);

          return (
            // biome-ignore lint/a11y/useSemanticElements: It's a calendar grid cell, not just a button
            <div
              className={cn(
                "min-h-[100px] cursor-pointer border-r border-b p-2 transition-colors hover:bg-muted/50",
                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                i % 7 === 6 && "border-r-0"
              )}
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleDayClick(day);
                }
              }}
              role='button'
              tabIndex={0}
            >
              <div className='flex items-center justify-between'>
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    isToday && "bg-primary font-medium text-primary-foreground"
                  )}
                >
                  {format(day, dateFormat)}
                </span>
              </div>

              <div className='mt-2 space-y-1 overflow-hidden'>
                {events.slice(0, 3).map((event, j) => (
                  <div
                    className='truncate rounded-sm px-1.5 py-0.5 font-medium text-[10px] text-white leading-tight'
                    key={`${event.code}-${j}`}
                    style={{ backgroundColor: getSubjectHexColor(event.code || event.title) }}
                  >
                    {event.startTime} {event.title}
                  </div>
                ))}
                {events.length > 3 && (
                  <div className='truncate rounded-sm bg-muted px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground leading-tight'>
                    +{events.length - 3} sự kiện khác
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DayEventsModal
        date={selectedDate}
        events={selectedEvents}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
