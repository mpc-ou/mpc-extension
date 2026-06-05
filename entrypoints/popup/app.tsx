import {
  Banknote,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ExternalLinkIcon,
  FacebookIcon,
  GithubIcon,
  User
} from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonNavSite } from "@/components/custom/button-nav-site";
import { InfoDialog } from "@/components/custom/info-dialog";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { _FACEBOOK_URL, _GITHUB_URL } from "@/constants";
import { _GET_BASIC_INFO } from "@/constants/chrome";
import { useTheme } from "@/lib/theme";
import { useCalendarStore } from "@/store/use-calendar-store";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import { useGlobalStore } from "@/store/use-global-store";
import { useInfoStore } from "@/store/use-info-store";
import { useScoreStore } from "@/store/use-score-store";
import { useTuitionStore } from "@/store/use-tuition-store";
import { isMatchURL } from "@/utils";
import { PopupContent } from "./components/popup-content";
import { useImportActions } from "./hooks/use-import-actions";

const WEEK_SORT_REGEX = /Tuần \((\d{2})\/(\d{2})\/(\d{4})/;

function App() {
  const { siteURLMapping } = useGlobalStore();
  const [currURL, setCurrURL] = useState("");
  const [siteCurr, setSiteCurr] = useState<"sv" | "kcq" | null>(null);

  const { getData: getInfoData } = useInfoStore();
  const { getData: getScoreData } = useScoreStore();
  const { getData: getCalendarData } = useCalendarStore();
  const { getData: getTuitionData } = useTuitionStore();
  const { setCurrentUser, studentId, displayName } = useCurrentUserStore();

  const { theme, changeTheme: handleThemeChange } = useTheme();

  useEffect(() => {
    const init = async () => {
      await useCurrentUserStore.getState().load();
      await Promise.all([getInfoData(), getScoreData(), getCalendarData(), getTuitionData()]);
    };
    init();
  }, [getInfoData, getScoreData, getCalendarData, getTuitionData]);

  useEffect(() => {
    if (!siteCurr) {
      return;
    }
    const scrape = async () => {
      try {
        const data = await browser.runtime.sendMessage({
          type: _GET_BASIC_INFO
        });
        if (data?.status === "success" && data.data?.studentId) {
          setCurrentUser(data.data.studentId, data.data.displayName, data.data.avatar || "");
          await Promise.all([getInfoData(), getScoreData(), getCalendarData(), getTuitionData()]);
        }
      } catch {
        /* site may not be loaded yet */
      }
    };
    scrape();
  }, [siteCurr, setCurrentUser, getInfoData, getScoreData, getCalendarData, getTuitionData]);

  useEffect(() => {
    const checkURL = async (tabId?: number) => {
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true
      });
      if (tabId !== undefined && activeTab?.id !== tabId) {
        return;
      }
      const url = activeTab?.url ?? "";
      setCurrURL(url);

      let matchedSite: "sv" | "kcq" | null = null;
      for (const [key, site] of Object.entries(siteURLMapping)) {
        if (isMatchURL(site.homepage.regex, site.homepage.url, url)) {
          matchedSite = key as "sv" | "kcq";
          break;
        }
      }
      setSiteCurr(matchedSite);
    };

    checkURL();

    const onUpdated = (tabId: number, changeInfo: { url?: string }) => {
      if (changeInfo.url) {
        checkURL(tabId);
      }
    };

    browser.tabs.onUpdated.addListener(onUpdated);
    return () => {
      browser.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [siteURLMapping]);

  const openDashboard = (tab?: string) => {
    browser.tabs.create({
      url: browser.runtime.getURL(`/index.html${tab ? `#${tab}` : ""}`)
    });
  };

  const navTo = (url: string) => {
    browser.tabs.create({ url });
  };

  const {
    isLoading,
    hasInfo,
    hasScore,
    hasStudyCalendar,
    hasExamCalendar,
    hasTuition,
    handleImportInfo,
    handleImportScore,
    handleImportCalendar,
    handleImportTuition
  } = useImportActions();

  const _PAGE_ICONS: Record<_PAGE_CATE, React.FC<{ className?: string }>> = {
    info: User,
    point: CheckCircle2,
    classCalendar: BookOpen,
    examCalendar: CalendarClock,
    tuition: Banknote
  };

  const navToSchoolPage = (pageKey: _PAGE_CATE) => {
    if (!siteCurr) {
      return;
    }
    const pageConfig = siteURLMapping[siteCurr].pages[pageKey];
    if (!pageConfig) {
      return;
    }
    const hashIndex = currURL.indexOf("#/");
    const baseUrl = hashIndex >= 0 ? currURL.substring(0, hashIndex) : siteURLMapping[siteCurr].homepage.url;
    browser.tabs.update(undefined, { url: `${baseUrl}${pageConfig.tailUrl}` });
  };

  return (
    <div className='flex min-h-100 w-87.5 flex-col bg-background'>
      <header className='flex items-center justify-between border-b bg-muted/40 px-4 py-3'>
        <div className='flex items-center gap-2'>
          <img alt='MPC' className='h-7 w-7 rounded-md' height={28} src='icon/128.png' width={28} />
          <h1 className='font-bold text-base text-primary tracking-tight'>MPC Extension</h1>
        </div>
        <div className='flex items-center gap-1'>
          <ThemeToggle onThemeChange={handleThemeChange} theme={theme} />
          <Button className='h-8 gap-1.5 px-3' onClick={() => openDashboard()} size='sm'>
            <ExternalLinkIcon className='h-3.5 w-3.5' />
            Dashboard
          </Button>
        </div>
      </header>

      {studentId && (
        <div className='border-b bg-muted/20 px-4 py-1.5 text-muted-foreground text-xs'>
          Chào <span className='font-medium text-foreground'>{displayName}</span> —{" "}
          <span className='font-mono text-muted-foreground'>{studentId}</span>
        </div>
      )}

      <main className='flex flex-1 flex-col justify-center'>
        <PopupContent
          currURL={currURL}
          handleImportCalendar={handleImportCalendar}
          handleImportInfo={handleImportInfo}
          handleImportScore={handleImportScore}
          handleImportTuition={handleImportTuition}
          hasExamCalendar={hasExamCalendar}
          hasInfo={hasInfo}
          hasScore={hasScore}
          hasStudyCalendar={hasStudyCalendar}
          hasTuition={hasTuition}
          isLoading={isLoading}
          kcqHomepage={siteURLMapping.kcq.homepage.url}
          navTo={navTo}
          openDashboard={openDashboard}
          siteCurr={siteCurr}
          svHomepage={siteURLMapping.sv.homepage.url}
        />
      </main>

      {siteCurr && (
        <div className='border-t px-3 py-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className='w-full gap-1.5' disabled={isLoading} size='sm' variant='outline'>
                <ClipboardList className='h-3.5 w-3.5' />
                Đến trang nhập liệu
                <ChevronDown className='ml-auto h-3 w-3' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='center' className='w-48'>
              <DropdownMenuLabel className='text-muted-foreground text-xs'>Mở trong tab hiện tại</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.entries(siteURLMapping[siteCurr].pages) as [_PAGE_CATE, _PAGE_CONFIG][]).map(([key, page]) => {
                const Icon = _PAGE_ICONS[key];
                return (
                  <DropdownMenuItem key={key} onClick={() => navToSchoolPage(key)}>
                    <Icon className='mr-2 h-4 w-4' />
                    {page.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <footer className='mt-auto flex flex-col items-center border-t bg-secondary py-3 text-muted-foreground text-xs'>
        <div className='mb-1 flex items-center gap-2'>© 2025, 2026 by MPC.</div>
        <div className='flex items-center gap-1'>
          <ButtonNavSite className='h-6 px-2' isBlank rel='noopener' size='sm' url={_FACEBOOK_URL} variant='link'>
            <FacebookIcon className='mr-1 h-4 w-4' /> Facebook
          </ButtonNavSite>
          <ButtonNavSite className='h-6 px-2' isBlank rel='noopener' size='sm' url={_GITHUB_URL} variant='link'>
            <GithubIcon className='mr-1 h-4 w-4' /> Github
          </ButtonNavSite>
          <div className='origin-left scale-75'>
            <InfoDialog />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
