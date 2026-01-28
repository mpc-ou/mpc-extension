import { FacebookIcon, GithubIcon } from "lucide-react";
import { Activity, useEffect } from "react";
import { ButtonNavSite } from "@/components/custom/button-nav-site";
import { InfoDialog } from "@/components/custom/info-dialog";
import { SidebarWidthAlert } from "@/components/custom/sidebar-width-alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { _FACEBOOK_URL, _GITHUB_URL } from "@/constants";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { ConfigTab } from "@/entrypoints/sidepanel/ConfigTab";
import { _TAB_CATE } from "@/entrypoints/sidepanel/type";
import { useGlobalStore } from "@/store/use-global-store";
import { getCurrTabURL } from "@/utils";
import { CalendarTab } from "./CalendarTab";
import { InfoTab } from "./InfoTab";
import { PointTab } from "./PointTab";
import { StatisticTab } from "./StatisticTab";

function App() {
  const { tab, setTab, getData, setSiteCurr, setSiteCurrURL } = useGlobalStore();

  const handleChangeTab = (value: _TAB_CATE) => {
    setTab(value);
  };

  useEffect(() => {
    const loadData = async () => {
      await getData();
    };
    loadData();
  }, [getData]);

  useEffect(() => {
    const loadSiteCurr = async () => {
      const currURL = await getCurrTabURL();
      let siteCurr: _SITE_CATE = "sv";

      for (const [key, site] of Object.entries(_DEFAULT_SITE_URL_MAPPING)) {
        if (currURL.startsWith(site.homepage)) {
          siteCurr = key as _SITE_CATE;
        }
      }

      setSiteCurr(siteCurr);
      setSiteCurrURL(currURL);
    };
    loadSiteCurr();
  }, [setSiteCurr, setSiteCurrURL]);

  return (
    <div>
      <div className='min-h-screen'>
        <SidebarWidthAlert />
        <Tabs className='flex w-full' onValueChange={(value) => handleChangeTab(value as _TAB_CATE)} value={tab}>
          <TabsList className='flex w-full flex-1 flex-wrap gap-3'>
            <TabsTrigger value='point'>Tính điểm</TabsTrigger>
            <TabsTrigger value='info'>Thông tin</TabsTrigger>
            <TabsTrigger value='calendar'>Lịch</TabsTrigger>
            <TabsTrigger value='statistic'>Thống kê</TabsTrigger>
            <TabsTrigger value='config'>Cài đặt</TabsTrigger>
          </TabsList>

          <Activity mode={tab ? "visible" : "hidden"}>
            <TabsContent value='point'>
              <PointTab />
            </TabsContent>
            <TabsContent value='info'>
              <InfoTab />
            </TabsContent>
            <TabsContent value='statistic'>
              <StatisticTab />
            </TabsContent>
            <TabsContent value='calendar'>
              <CalendarTab />
            </TabsContent>
            <TabsContent value='config'>
              <ConfigTab />
            </TabsContent>
          </Activity>
        </Tabs>
      </div>

      <footer className='mt-4 flex items-center justify-center bg-secondary py-2 text-md text-primary'>
        © 2025, 2026 by MPC. Made with ❤️ for students of OU.
        <ButtonNavSite isBlank rel='noopener' size='sm' url={_FACEBOOK_URL} variant='link'>
          <FacebookIcon className='h-5 w-5' />
        </ButtonNavSite>
        <ButtonNavSite isBlank rel='noopener' size='sm' url={_GITHUB_URL} variant='link'>
          <GithubIcon className='h-5 w-5' />
        </ButtonNavSite>
        <InfoDialog />
      </footer>
    </div>
  );
}

export default App;
