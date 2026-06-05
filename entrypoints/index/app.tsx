import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { AppHeader } from "@/components/custom/app-header";
import { AppSidebar } from "@/components/custom/app-sidebar";
import { OnboardingDialog } from "@/components/custom/onboarding-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmDialogProvider } from "@/hooks/use-confirm";
import { useTheme } from "@/lib/theme";
import packageJson from "@/package.json";
import { useCalendarStore } from "@/store/use-calendar-store";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import { useGlobalStore } from "@/store/use-global-store";
import { useInfoStore } from "@/store/use-info-store";
import { useScoreStore } from "@/store/use-score-store";
import { useTuitionStore } from "@/store/use-tuition-store";
import { useUserSettingsStore } from "@/store/use-user-settings-store";
import type { UserSettingsType } from "@/types";
import { AboutUsPage } from "./pages/AboutUsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PersonalInfoPage } from "./pages/PersonalInfoPage";
import { ScorePlanPage } from "./pages/ScorePlanPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TuitionPage } from "./pages/TuitionPage";
import { BREADCRUMB_MAP, type DashboardRoute, NAV_ITEMS } from "./types";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "local:mpc-sidebar-collapsed";
const ONBOARDING_STORAGE_KEY = "local:mpc-onboarding-completed";

function getInitialRoute(): DashboardRoute {
  const hash = window.location.hash.replace("#", "");
  if (["dashboard", "score-plan", "calendar", "tuition", "settings", "personal-info", "about-us"].includes(hash)) {
    return hash as DashboardRoute;
  }
  return "dashboard";
}

function App() {
  const [route, setRoute] = useState<DashboardRoute>(getInitialRoute);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [storageReady, setStorageReady] = useState(false);
  const { theme, changeTheme } = useTheme();

  useEffect(() => {
    Promise.all([
      storage.getItem<string>(SIDEBAR_COLLAPSED_STORAGE_KEY),
      storage.getItem<string>(ONBOARDING_STORAGE_KEY)
    ]).then(([collapsed, onboarding]) => {
      setSidebarCollapsed(collapsed === "1");
      setShowOnboarding(onboarding !== "1");
      setStorageReady(true);
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getData = useGlobalStore((s) => s.getData);
  const getScoreData = useScoreStore((s) => s.getData);
  const setupScoreWatcher = useScoreStore((s) => s.setupWatcher);
  const getInfoData = useInfoStore((s) => s.getData);
  const getCalendarData = useCalendarStore((s) => s.getData);
  const getTuitionData = useTuitionStore((s) => s.getData);
  const getUserSettingsData = useUserSettingsStore((s) => s.getData);
  const setUserSettings = useUserSettingsStore((s) => s.setSettings);
  const loadCurrentUser = useCurrentUserStore((s) => s.load);
  const effectiveStudentId = useCurrentUserStore((s) => s.effectiveStudentId);

  useLayoutEffect(() => {
    const init = async () => {
      await loadCurrentUser();
      getData();
      getScoreData();
      getInfoData();
      getCalendarData();
      getTuitionData();
      getUserSettingsData();
    };
    init();
    const unwatch = setupScoreWatcher();
    return () => {
      unwatch?.();
    };
  }, [
    loadCurrentUser,
    getData,
    getScoreData,
    getInfoData,
    getCalendarData,
    getTuitionData,
    getUserSettingsData,
    setupScoreWatcher
  ]);

  useEffect(() => {
    if (!effectiveStudentId) {
      return;
    }
    Promise.all([getScoreData(), getInfoData(), getCalendarData(), getTuitionData(), getUserSettingsData()]);
  }, [effectiveStudentId, getScoreData, getInfoData, getCalendarData, getTuitionData, getUserSettingsData]);

  useEffect(() => {
    let lastFetch = 0;
    const onVisible = () => {
      if (document.visibilityState !== "visible" || !effectiveStudentId) {
        return;
      }
      if (Date.now() - lastFetch < 2000) {
        return;
      }
      lastFetch = Date.now();
      Promise.all([getScoreData(), getInfoData(), getCalendarData(), getTuitionData(), getUserSettingsData()]);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [effectiveStudentId, getScoreData, getInfoData, getCalendarData, getTuitionData, getUserSettingsData]);

  const handleNavigate = useCallback((key: string) => {
    const r = key as DashboardRoute;
    setRoute(r);
    window.location.hash = r;
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "") as DashboardRoute;
      if (["dashboard", "score-plan", "calendar", "tuition", "settings", "personal-info", "about-us"].includes(hash)) {
        setRoute(hash);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    storage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleOnboardingComplete = (settings: UserSettingsType) => {
    setUserSettings(settings);
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  const renderPage = () => {
    switch (route) {
      case "dashboard":
        return <DashboardPage />;
      case "personal-info":
        return <PersonalInfoPage />;
      case "score-plan":
        return <ScorePlanPage />;
      case "calendar":
        return <CalendarPage />;
      case "tuition":
        return <TuitionPage />;
      case "settings":
        return <SettingsPage onThemeChange={changeTheme} theme={theme} />;
      case "about-us":
        return <AboutUsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <TooltipProvider>
      <div className='flex h-screen overflow-hidden bg-background'>
        <AppSidebar
          activeKey={route}
          collapsed={isMobile ? !mobileOpen : sidebarCollapsed}
          footer={
            <p className='text-center text-muted-foreground text-xs'>
              MPC Extension v{packageJson.version} <br />© 2025, 2026 MPClub - Trường Đại học Mở TP.HCM
            </p>
          }
          isMobile={isMobile}
          logo={
            <div className='flex items-center gap-2'>
              <img alt='Logo' className='h-8 w-8' height={32} src='/icon/128.png' width={32} />
              <div>
                <p className='font-semibold text-sm leading-none'>MPC Extension</p>
                <p className='mt-0.5 text-muted-foreground text-xs'>Quản lý học tập</p>
              </div>
            </div>
          }
          logoCollapsed={<img alt='Logo' className='h-8 w-8' height={32} src='/icon/128.png' width={32} />}
          navItems={NAV_ITEMS}
          onClose={() => setMobileOpen(false)}
          onNavigate={handleNavigate}
          onToggle={handleSidebarToggle}
        />

        <div className='flex flex-1 flex-col overflow-hidden'>
          <AppHeader
            breadcrumbs={BREADCRUMB_MAP[route]}
            onSidebarToggle={handleSidebarToggle}
            onThemeChange={changeTheme}
            sidebarCollapsed={isMobile ? !mobileOpen : sidebarCollapsed}
            theme={theme}
          />

          <main className='flex-1 overflow-y-auto p-6'>{renderPage()}</main>
        </div>
      </div>
      <ConfirmDialogProvider />
      {storageReady && (
        <OnboardingDialog onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} open={showOnboarding} />
      )}
    </TooltipProvider>
  );
}

export default App;
