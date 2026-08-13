import {
  _DATE_MATCH_REGEX,
  _ICS_DEFAULT_EXAM_DURATION_MINUTES,
  _ICS_METADATA,
  _ICS_UID_DOMAIN,
  _WEEK_YEAR_REGEX
} from "@/constants";
import type { CalendarEntry, SemesterData } from "@/types";

export type ICSReminderUnit = "minutes" | "hours" | "days";
export type ICSReminderAction = "DISPLAY" | "EMAIL";

export type ICSReminderOptions = {
  enabled: boolean;
  amount: number;
  unit: ICSReminderUnit;
  action: ICSReminderAction;
};

const _ROOM_LABEL_SPLIT_REGEX = /,| - /;

export type ICSExportOptions = {
  calendarName?: string;
  reminders?: ICSReminderOptions[];
};

function parseDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-");
  const [hour, minute] = timeStr.split(":");
  return new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
    Number.parseInt(hour, 10),
    Number.parseInt(minute, 10)
  );
}

function formatICSDateTime(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function getShortRoomLabel(room: string): string {
  return room.split(_ROOM_LABEL_SPLIT_REGEX)[0].trim();
}

function generateUID(entry: CalendarEntry, dateKey: string): string {
  const eventType = entry.eventType || entry.category;
  const group = entry.group || "0";
  return `${entry.code}-${group}-${eventType}-${dateKey}-${entry.startPeriod}@${_ICS_UID_DOMAIN}`;
}

function escapeICSText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function foldICSLine(line: string): string {
  const limit = 75;
  if (line.length <= limit) {
    return line;
  }

  const chunks: string[] = [];
  let rest = line;
  while (rest.length > limit) {
    chunks.push(rest.slice(0, limit));
    rest = rest.slice(limit);
  }
  chunks.push(rest);
  return chunks.join("\r\n ");
}

function formatICSBlock(lines: string[]): string {
  return lines
    .flatMap((line) => line.split("\r\n"))
    .map(foldICSLine)
    .join("\r\n");
}

function getReminderTrigger(reminder: ICSReminderOptions): string {
  if (reminder.unit === "days") {
    return `-P${reminder.amount}D`;
  }
  const unit = reminder.unit === "hours" ? "H" : "M";
  return `-PT${reminder.amount}${unit}`;
}

function createReminderBlock(summary: string, description: string, reminder: ICSReminderOptions): string[] {
  if (!(reminder?.enabled && Number.isFinite(reminder.amount) && reminder.amount > 0)) {
    return [];
  }

  const action = reminder.action;
  const alarmLines = [
    "BEGIN:VALARM",
    `ACTION:${action}`,
    `TRIGGER:${getReminderTrigger(reminder)}`,
    `DESCRIPTION:${description}`
  ];

  if (action === "EMAIL") {
    alarmLines.push(`SUMMARY:${summary}`);
  }

  alarmLines.push("END:VALARM");
  return alarmLines;
}

function createReminderBlocks(summary: string, description: string, reminders?: ICSReminderOptions[]): string[] {
  if (!reminders?.length) {
    return [];
  }
  return reminders.flatMap((reminder) => createReminderBlock(summary, description, reminder));
}

function createEventFromEntry(
  entry: CalendarEntry,
  year: string,
  scheduleDateMatch: RegExpMatchArray,
  options: ICSExportOptions
): string | null {
  const [, day, month] = scheduleDateMatch;
  const dateKey = `${year}-${month}-${day}`;

  if (!entry.startTime) {
    return null;
  }

  const startDate = parseDateTime(dateKey, entry.startTime);
  const endDate = entry.endTime
    ? parseDateTime(dateKey, entry.endTime)
    : new Date(startDate.getTime() + _ICS_DEFAULT_EXAM_DURATION_MINUTES * 60_000);

  const uid = generateUID(entry, dateKey);
  const roomLabel = entry.room ? getShortRoomLabel(entry.room) : "";
  const summary = escapeICSText(roomLabel ? `${roomLabel} - ${entry.title}` : entry.title);
  const location = escapeICSText(entry.room || "");

  const descriptionParts = [
    `Môn: ${entry.title}`,
    `Mã: ${entry.code}`,
    `Nhóm: ${entry.group}`,
    `Tiết: ${entry.startPeriod} - ${entry.endPeriod}`
  ];
  if (entry.teacher) {
    descriptionParts.push(`GV: ${entry.teacher}`);
  }
  const description = escapeICSText(descriptionParts.join("\n"));
  const calendarName = options.calendarName || _ICS_METADATA.CALENDAR_NAME;

  const now = new Date();
  const dtstamp = formatICSDateTime(now);

  return formatICSBlock([
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${formatICSDateTime(startDate)}`,
    `DTEND:${formatICSDateTime(endDate)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    `CATEGORIES:${escapeICSText(calendarName)}`,
    "STATUS:CONFIRMED",
    ...createReminderBlocks(summary, description, options.reminders),
    "END:VEVENT"
  ]);
}

const processWeeks = (weeks: SemesterData["weeks"], options: ICSExportOptions): string[] => {
  const calendarEvents: string[] = [];

  for (const weekData of weeks) {
    const weekYearMatch = weekData.week.match(_WEEK_YEAR_REGEX);
    const year = weekYearMatch ? weekYearMatch[1] : new Date().getFullYear().toString();

    for (const entry of weekData.schedule) {
      const dateMatch = entry.day.match(_DATE_MATCH_REGEX);
      if (!dateMatch) {
        continue;
      }

      const eventBlock = createEventFromEntry(entry, year, dateMatch, options);
      if (eventBlock) {
        calendarEvents.push(eventBlock);
      }
    }
  }
  return calendarEvents;
};

export function convertToICS(data: SemesterData[], options: ICSExportOptions = {}): string {
  const allEvents: string[] = [];
  const calendarName = options.calendarName || _ICS_METADATA.CALENDAR_NAME;

  for (const semester of data) {
    allEvents.push(...processWeeks(semester.weeks, options));
  }

  const icsContent = formatICSBlock([
    "BEGIN:VCALENDAR",
    `VERSION:${_ICS_METADATA.VERSION}`,
    `PRODID:${_ICS_METADATA.PRODID}`,
    `CALSCALE:${_ICS_METADATA.CALSCALE}`,
    `METHOD:${_ICS_METADATA.METHOD}`,
    `X-WR-CALNAME:${escapeICSText(calendarName)}`,
    `NAME:${escapeICSText(calendarName)}`,
    `X-WR-CALDESC:${escapeICSText(calendarName)}`,
    `X-WR-TIMEZONE:${_ICS_METADATA.TIMEZONE}`,
    ...allEvents,
    "END:VCALENDAR"
  ]);

  return icsContent;
}

export function downloadICS(data: SemesterData[], options: ICSExportOptions = {}): void {
  const icsContent = convertToICS(data, options);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeCalendarName = (options.calendarName || "TKB").replace(/[\\/:*?"<>|]/g, "_");
  link.href = url;
  link.download = `${safeCalendarName}_${new Date().toISOString().split("T")[0]}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
