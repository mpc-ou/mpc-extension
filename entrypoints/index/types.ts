import { Banknote, CalendarDays, GraduationCap, Info, LayoutDashboard, Settings, UserCircle } from "lucide-react";
import type { SidebarNavItem } from "@/components/custom/app-sidebar";

export type DashboardRoute =
  | "dashboard"
  | "score-plan"
  | "calendar"
  | "tuition"
  | "settings"
  | "personal-info"
  | "about-us";

export const NAV_ITEMS: SidebarNavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "score-plan", label: "Kế hoạch điểm số", icon: GraduationCap },
  { key: "calendar", label: "Lịch học tập", icon: CalendarDays },
  { key: "tuition", label: "Học phí", icon: Banknote },
  { key: "personal-info", label: "Thông tin cá nhân", icon: UserCircle },
  { key: "settings", label: "Cài đặt", icon: Settings },
  { key: "about-us", label: "Về chúng tôi", icon: Info }
];

export const BREADCRUMB_MAP: Record<DashboardRoute, string[]> = {
  dashboard: ["MPC", "Dashboard"],
  "personal-info": ["MPC", "Thông tin cá nhân"],
  "score-plan": ["MPC", "Kế hoạch điểm số"],
  calendar: ["MPC", "Lịch học tập"],
  tuition: ["MPC", "Học phí"],
  settings: ["MPC", "Cài đặt"],
  "about-us": ["MPC", "Về chúng tôi"]
};
