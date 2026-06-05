import type { PeriodSession, PeriodTimeTable } from "@/types";

/**
 * Period time maps for different campus groups.
 * Group 1: Võ Văn Tần (VVT), Mai Thị Lựu (MLA)
 * Group 2: Nhơn Đức/Nhà Bè (NB), Long Bình Tân/Long Hưng (LB), Bình Dương, Gia Phú (GP)
 *
 * ── Structure mirrors the official OU time allocation tables,
 *     including break periods and lab-group split variants. ──
 */

export const PERIOD_TIME_MAP_GROUP_1: Record<number, { start: string; end: string }> = {
  1: { start: "07:00", end: "07:50" },
  2: { start: "07:50", end: "08:40" },
  3: { start: "08:40", end: "09:45" },
  4: { start: "09:45", end: "10:35" },
  5: { start: "10:35", end: "11:25" },
  6: { start: "11:30", end: "12:40" },
  7: { start: "12:45", end: "13:35" },
  8: { start: "13:35", end: "14:25" },
  9: { start: "14:25", end: "15:30" },
  10: { start: "15:30", end: "16:20" },
  11: { start: "16:20", end: "17:10" },
  12: { start: "17:30", end: "18:20" },
  13: { start: "18:20", end: "19:10" },
  14: { start: "19:10", end: "20:00" },
  15: { start: "20:00", end: "20:50" },
  16: { start: "20:50", end: "21:40" }
};

export const PERIOD_TIME_MAP_GROUP_2: Record<number, { start: string; end: string }> = {
  1: { start: "07:30", end: "08:20" },
  2: { start: "08:20", end: "09:10" },
  3: { start: "09:10", end: "10:15" },
  4: { start: "10:15", end: "11:05" },
  5: { start: "11:05", end: "11:55" },
  6: { start: "12:00", end: "12:55" },
  7: { start: "13:00", end: "13:50" },
  8: { start: "13:50", end: "14:40" },
  9: { start: "14:40", end: "15:45" },
  10: { start: "15:45", end: "16:35" },
  11: { start: "16:35", end: "17:25" },
  12: { start: "17:30", end: "18:20" },
  13: { start: "18:20", end: "19:10" },
  14: { start: "19:10", end: "20:00" },
  15: { start: "20:00", end: "20:50" },
  16: { start: "20:50", end: "21:40" }
};

// ── Group 1: VVT, MLA, GP ──

const GROUP1_NORMAL: PeriodSession[] = [
  {
    sessionName: "Sáng",
    slots: [
      { label: "Tiết 1", start: "07:00", end: "07:50" },
      { label: "Tiết 2", start: "07:50", end: "08:40" },
      { label: "Tiết 3 (đầu)", start: "08:40", end: "09:05" },
      { label: "Giải lao", start: "09:05", end: "09:20", isBreak: true },
      { label: "Tiết 3 (cuối)", start: "09:20", end: "09:45" },
      { label: "Tiết 4", start: "09:45", end: "10:35" },
      { label: "Tiết 5", start: "10:35", end: "11:25" }
    ]
  },
  {
    sessionName: "Chiều",
    slots: [
      { label: "Tiết 1", start: "12:45", end: "13:35" },
      { label: "Tiết 2", start: "13:35", end: "14:25" },
      { label: "Tiết 3 (đầu)", start: "14:25", end: "14:50" },
      { label: "Giải lao", start: "14:50", end: "15:05", isBreak: true },
      { label: "Tiết 3 (cuối)", start: "15:05", end: "15:30" },
      { label: "Tiết 4", start: "15:30", end: "16:20" },
      { label: "Tiết 5", start: "16:20", end: "17:10" }
    ]
  },
  {
    sessionName: "Tối",
    slots: [
      { label: "Tiết 1", start: "17:30", end: "18:20" },
      { label: "Tiết 2", start: "18:20", end: "19:10" },
      { label: "Tiết 3", start: "19:10", end: "20:00" }
    ]
  }
];

const GROUP1_LAB: PeriodSession[] = [
  {
    sessionName: "Sáng",
    slots: [
      { label: "Nhóm 1 - Tiết 1", start: "07:00", end: "07:50" },
      { label: "Nhóm 1 - Tiết 2", start: "07:50", end: "08:40" },
      { label: "Nhóm 1 - 2,5 tiết", start: "08:40", end: "09:05" },
      { label: "Chuyển nhóm", start: "09:05", end: "09:20", isBreak: true },
      { label: "Nhóm 2 - Tiết 1", start: "09:20", end: "10:10" },
      { label: "Nhóm 2 - Tiết 2", start: "10:10", end: "11:00" },
      { label: "Nhóm 2 - 2,5 tiết", start: "11:00", end: "11:25" }
    ]
  },
  {
    sessionName: "Chiều",
    slots: [
      { label: "Nhóm 1 - Tiết 1", start: "12:45", end: "13:35" },
      { label: "Nhóm 1 - Tiết 2", start: "13:35", end: "14:25" },
      { label: "Nhóm 1 - 2,5 tiết", start: "14:25", end: "14:50" },
      { label: "Chuyển nhóm", start: "14:50", end: "15:05", isBreak: true },
      { label: "Nhóm 2 - Tiết 1", start: "15:05", end: "15:55" },
      { label: "Nhóm 2 - Tiết 2", start: "15:55", end: "16:45" },
      { label: "Nhóm 2 - 2,5 tiết", start: "16:45", end: "17:10" }
    ]
  },
  {
    sessionName: "Tối",
    slots: [{ label: "2,5 tiết", start: "17:30", end: "19:35" }]
  }
];

// ── Group 2: NB, LB, Bình Dương ──

const GROUP2_NORMAL: PeriodSession[] = [
  {
    sessionName: "Sáng",
    slots: [
      { label: "Tiết 1", start: "07:30", end: "08:20" },
      { label: "Tiết 2", start: "08:20", end: "09:10" },
      { label: "Tiết 3 (đầu)", start: "09:10", end: "09:35" },
      { label: "Giải lao", start: "09:35", end: "09:50", isBreak: true },
      { label: "Tiết 3 (cuối)", start: "09:50", end: "10:15" },
      { label: "Tiết 4", start: "10:15", end: "11:05" },
      { label: "Tiết 5", start: "11:05", end: "11:55" }
    ]
  },
  {
    sessionName: "Chiều",
    slots: [
      { label: "Tiết 1", start: "13:00", end: "13:50" },
      { label: "Tiết 2", start: "13:50", end: "14:40" },
      { label: "Tiết 3 (đầu)", start: "14:40", end: "15:05" },
      { label: "Giải lao", start: "15:05", end: "15:20", isBreak: true },
      { label: "Tiết 3 (cuối)", start: "15:20", end: "15:45" },
      { label: "Tiết 4", start: "15:45", end: "16:35" },
      { label: "Tiết 5", start: "16:35", end: "17:25" }
    ]
  },
  {
    sessionName: "Tối",
    slots: [
      { label: "Tiết 1", start: "17:30", end: "18:20" },
      { label: "Tiết 2", start: "18:20", end: "19:10" },
      { label: "Tiết 3", start: "19:10", end: "20:00" }
    ]
  }
];

const GROUP2_LAB: PeriodSession[] = [
  {
    sessionName: "Sáng",
    slots: [
      { label: "Nhóm 1 - Tiết 1", start: "07:30", end: "08:20" },
      { label: "Nhóm 1 - Tiết 2", start: "08:20", end: "09:10" },
      { label: "Nhóm 1 - 2,5 tiết", start: "09:10", end: "09:35" },
      { label: "Chuyển nhóm", start: "09:35", end: "09:50", isBreak: true },
      { label: "Nhóm 2 - Tiết 1", start: "09:50", end: "10:40" },
      { label: "Nhóm 2 - Tiết 2", start: "10:40", end: "11:30" },
      { label: "Nhóm 2 - 2,5 tiết", start: "11:30", end: "11:55" }
    ]
  },
  {
    sessionName: "Chiều",
    slots: [
      { label: "Nhóm 1 - Tiết 1", start: "13:00", end: "13:50" },
      { label: "Nhóm 1 - Tiết 2", start: "13:50", end: "14:40" },
      { label: "Nhóm 1 - 2,5 tiết", start: "14:40", end: "15:05" },
      { label: "Chuyển nhóm", start: "15:05", end: "15:20", isBreak: true },
      { label: "Nhóm 2 - Tiết 1", start: "15:20", end: "16:10" },
      { label: "Nhóm 2 - Tiết 2", start: "16:10", end: "17:00" },
      { label: "Nhóm 2 - 2,5 tiết", start: "17:00", end: "17:25" }
    ]
  },
  {
    sessionName: "Tối",
    slots: [{ label: "2,5 tiết", start: "17:30", end: "19:35" }]
  }
];

export const PERIOD_TIME_TABLES: PeriodTimeTable[] = [
  {
    groupName: "Nhóm 1",
    campuses: "97 Võ Văn Tần, 02 Mai Thị Lựu (VVT, MLA)",
    normalSchedule: GROUP1_NORMAL,
    labGroupSchedule: GROUP1_LAB
  },
  {
    groupName: "Nhóm 2",
    campuses: "Nhơn Đức (Nhà Bè), Long Bình Tân (Long Hưng), Bình Dương, Gia Phú  (NB, LB, GP)",
    normalSchedule: GROUP2_NORMAL,
    labGroupSchedule: GROUP2_LAB
  }
];

/** Map locationType → which group's period map to use. */
export const LOCATION_PERIOD_GROUP: Record<string, number> = {
  VVT: 1,
  MLA: 1,
  GP: 2,
  NB: 2,
  LB: 2
};
