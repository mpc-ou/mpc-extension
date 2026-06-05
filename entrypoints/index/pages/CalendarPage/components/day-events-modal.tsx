import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CalendarEntry } from "@/types";
import { getCategoryLabel, getLocationLabel, getSubjectHexColor } from "@/utils/calendar-format";

type DayEventsModalProps = {
  date: Date | null;
  events: CalendarEntry[];
  isOpen: boolean;
  onClose: () => void;
};

export function DayEventsModal({ date, events, isOpen, onClose }: DayEventsModalProps) {
  if (!date) {
    return null;
  }

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Lịch học {format(date, "EEEE, dd/MM/yyyy", { locale: vi })}</DialogTitle>
        </DialogHeader>

        {events.length === 0 ? (
          <div className='py-8 text-center text-muted-foreground'>Không có lịch trong ngày này</div>
        ) : (
          <ScrollArea className='max-h-[60vh] pr-4'>
            <div className='space-y-3'>
              {events.map((event, i) => (
                <div
                  className='flex items-start gap-3 rounded-lg border p-3'
                  key={`${event.code}-${event.startPeriod}-${i}`}
                >
                  <div
                    className='mt-1 h-3 w-3 shrink-0 rounded-full'
                    style={{ backgroundColor: getSubjectHexColor(event.code || event.title) }}
                  />
                  <div className='flex-1 space-y-1'>
                    <div className='flex flex-wrap items-center gap-2 font-medium leading-none'>
                      {event.title}
                      <Badge
                        className='h-4 whitespace-nowrap px-1 py-0 font-medium text-[10px] leading-none'
                        variant='outline'
                      >
                        {getCategoryLabel(event.category)}
                      </Badge>
                      {event.locationType && event.locationType !== "OTHER" && (
                        <Badge
                          className='h-4 whitespace-nowrap px-1 py-0 font-medium text-[10px] leading-none'
                          variant='secondary'
                        >
                          {getLocationLabel(event.locationType)}
                        </Badge>
                      )}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      {event.startTime} - {event.endTime}
                    </div>
                    {event.description && <div className='text-muted-foreground text-xs'>{event.description}</div>}
                    <div className='mt-2 space-y-1 text-muted-foreground text-xs'>
                      {event.room && <div>Phòng: {event.room}</div>}
                      {event.group && <div>Nhóm: {event.group}</div>}
                      {event.teacher && <div>Giảng viên: {event.teacher}</div>}
                      {event.link && (
                        <div className='mt-2'>
                          <a
                            className='inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                            href={event.link}
                            onClick={(e) => e.stopPropagation()}
                            rel='noreferrer'
                            target='_blank'
                          >
                            <Video className='h-4 w-4' />
                            Tham gia lớp học Online
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
