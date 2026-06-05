import { _DATE_MATCH_REGEX, _ICS_METADATA, _ICS_UID_DOMAIN, _WEEK_YEAR_REGEX } from "@/constants";
import type { CalendarEntry, SemesterData } from "@/types";

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

function generateUID(entry: CalendarEntry, dateKey: string): string {
  return `${entry.code}-${dateKey}-${entry.startPeriod}@${_ICS_UID_DOMAIN}`;
}

function escapeICSText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function createEventFromEntry(entry: CalendarEntry, year: string, scheduleDateMatch: RegExpMatchArray): string | null {
  const [, day, month] = scheduleDateMatch;
  const dateKey = `${year}-${month}-${day}`;

  if (!(entry.startTime && entry.endTime)) {
    return null;
  }

  const startDate = parseDateTime(dateKey, entry.startTime);
  const endDate = parseDateTime(dateKey, entry.endTime);

  const uid = generateUID(entry, dateKey);
  const summary = escapeICSText(`${entry.title} (${entry.code})`);
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
  const description = escapeICSText(descriptionParts.join("\\n"));

  const now = new Date();
  const dtstamp = formatICSDateTime(now);

  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${formatICSDateTime(startDate)}`,
    `DTEND:${formatICSDateTime(endDate)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "STATUS:CONFIRMED",
    "END:VEVENT"
  ].join("\r\n");
}

const processWeeks = (weeks: SemesterData["weeks"]): string[] => {
  const calendarEvents: string[] = [];

  for (const weekData of weeks) {
    const weekYearMatch = weekData.week.match(_WEEK_YEAR_REGEX);
    const year = weekYearMatch ? weekYearMatch[1] : new Date().getFullYear().toString();

    for (const entry of weekData.schedule) {
      const dateMatch = entry.day.match(_DATE_MATCH_REGEX);
      if (!dateMatch) {
        continue;
      }

      const eventBlock = createEventFromEntry(entry, year, dateMatch);
      if (eventBlock) {
        calendarEvents.push(eventBlock);
      }
    }
  }
  return calendarEvents;
};

export function convertToICS(data: SemesterData[]): string {
  const allEvents: string[] = [];

  for (const semester of data) {
    allEvents.push(...processWeeks(semester.weeks));
  }

  const icsContent = [
    "BEGIN:VCALENDAR",
    `VERSION:${_ICS_METADATA.VERSION}`,
    `PRODID:${_ICS_METADATA.PRODID}`,
    `CALSCALE:${_ICS_METADATA.CALSCALE}`,
    `METHOD:${_ICS_METADATA.METHOD}`,
    `X-WR-CALNAME:${_ICS_METADATA.CALENDAR_NAME}`,
    `X-WR-TIMEZONE:${_ICS_METADATA.TIMEZONE}`,
    ...allEvents,
    "END:VCALENDAR"
  ].join("\r\n");

  return icsContent;
}

export function downloadICS(data: SemesterData[]): void {
  const icsContent = convertToICS(data);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `TKB_${new Date().toISOString().split("T")[0]}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
