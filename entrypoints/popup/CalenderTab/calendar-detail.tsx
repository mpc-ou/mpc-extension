import { BookOpenIcon, ClockIcon, MapPinIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CalendarEntry } from "./scripts";
import { formatDate, formatTime, getSubjectColor } from "./utils/format";

type CalendarDetailProps = {
  selectedDate: Date | undefined;
  schedule: CalendarEntry[];
};

const categoryBadges = {
  COURSE: (
    <Badge className='bg-blue-500 text-white dark:bg-blue-600' variant='secondary'>
      Khóa học
    </Badge>
  ),
  LAB: (
    <Badge className='bg-purple-500 text-white dark:bg-purple-600' variant='secondary'>
      Thực hành
    </Badge>
  ),
  EXAM: (
    <Badge className='bg-red-500 text-white dark:bg-red-600' variant='secondary'>
      Thi
    </Badge>
  ),
  HOLIDAY: (
    <Badge className='bg-green-500 text-white dark:bg-green-600' variant='secondary'>
      Nghỉ lễ
    </Badge>
  ),
  LESSON: (
    <Badge className='bg-yellow-500 text-white dark:bg-yellow-600' variant='secondary'>
      Bài học
    </Badge>
  ),
  OTHER: (
    <Badge className='bg-gray-500 text-white dark:bg-gray-600' variant='secondary'>
      Khác
    </Badge>
  )
};

const VerifiedBadge = (category: string) =>
  categoryBadges[category as keyof typeof categoryBadges] || categoryBadges.OTHER;

export function CalendarDetail({ selectedDate, schedule }: CalendarDetailProps) {
  if (!selectedDate) {
    return (
      <Card className='flex h-full items-center justify-center'>
        <CardContent className='py-12 text-center text-muted-foreground'>
          <BookOpenIcon className='mx-auto mb-4 h-16 w-16 text-gray-300' />
          <p>Chọn một ngày để xem lịch học</p>
        </CardContent>
      </Card>
    );
  }

  if (schedule.length === 0) {
    return (
      <Card className='h-full py-4'>
        <CardHeader>
          <CardTitle className='text-sm'>{formatDate(selectedDate)}</CardTitle>
        </CardHeader>
        <CardContent className='py-12 text-center text-muted-foreground'>
          <BookOpenIcon className='mx-auto mb-3 h-12 w-12 text-gray-300' />
          <p>Không có lịch học trong ngày này</p>
        </CardContent>
      </Card>
    );
  }

  const sortedSchedule = [...schedule].sort((a, b) => (a.startPeriod ?? 0) - (b.startPeriod ?? 0));

  return (
    <Card className='flex h-full flex-col gap-2 overflow-y-auto py-4'>
      <CardHeader className='flex-shrink-0'>
        <CardTitle className='flex items-center justify-between gap-2'>
          <span className='text-sm'>{formatDate(selectedDate)}</span>
          <span className='text-md text-muted-foreground'>{sortedSchedule.length} sự kiện.</span>
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className='flex-1 space-y-3 overflow-y-auto px-2'>
        {sortedSchedule.map((entry) => (
          <Card
            className={`border ${getSubjectColor(entry.code ? entry.code : "default")} rounded-lg px-2 py-2`}
            key={`${entry.code ?? "unknown"}-${entry.group}-${entry.startPeriod ?? "0"}`}
          >
            <CardContent className='space-y-2 px-2 py-2'>
              <div>
                <h3 className='font-semibold text-base leading-tight'>
                  {entry.title}
                  <span className='ml-2'>{VerifiedBadge(entry.category)}</span>
                </h3>
                <p className='mt-0.5 text-xs opacity-75'>
                  Mã: {entry.code} | Nhóm: {entry.group} | GV: {entry.teacher ? entry.teacher : "Chưa cập nhật"}
                </p>
              </div>

              <div className='flex items-start gap-2 text-sm'>
                <ClockIcon className='mt-0.5 h-4 w-4 flex-shrink-0' />
                <div className='flex-1'>
                  <p className='text-sm'>
                    Tiết {entry.startPeriod ?? "?"} - {entry.endPeriod ?? "?"} |{" "}
                    <b>
                      {formatTime(entry.startTime)} {entry.endTime ? `- ${formatTime(entry.endTime)}` : ""}
                    </b>
                  </p>
                </div>
              </div>

              {entry.room ? (
                <div className='flex items-center gap-2 text-sm'>
                  <MapPinIcon className='h-4 w-4 flex-shrink-0' />
                  <p>Phòng: {entry.room}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
