import { FacebookIcon, GithubIcon } from "lucide-react";
import { Activity, useEffect } from "react";
import { InfoDialog } from "@/components/custom/info-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { _FACEBOOK_URL, _GITHUB_URL } from "@/constants";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { ConfigTab } from "@/entrypoints/popup/ConfigTab";
import { _TAB_CATE } from "@/entrypoints/popup/type";
import { useGlobalStore } from "@/store/use-global-store";
import { getCurrTabURL, openNewTab } from "@/utils";
import { CalendarTab } from "./CalendarTab";
import { InfoTab } from "./InfoTab";
import { PointTab } from "./PointTab";
import { StatisticTab } from "./StatisticTab";

function App() {
  const { tab, setTab, getData, setSiteCurr, setSiteCurrURL } = useGlobalStore();

  const handleOpenNewTab = async (type: "fb" | "github") => {
    let url = "";
    switch (type) {
      case "fb":
        url = _FACEBOOK_URL;
        break;
      case "github":
        url = _GITHUB_URL;
        break;
      default:
        break;
    }

    await openNewTab(url);
  };

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
    <div className='min-w-180'>
      <Tabs onValueChange={(value) => handleChangeTab(value as _TAB_CATE)} value={tab}>
        <TabsList className='w-full'>
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

      <footer className='mt-4 flex items-center justify-center bg-secondary py-2 text-md text-primary'>
        © 2025, 2026 by MPC. Made with ❤️ for students of OU.
        <Button onClick={() => handleOpenNewTab("fb")} rel='noopener' size='sm' variant='link'>
          <FacebookIcon className='h-5 w-5' />
        </Button>
        <Button onClick={() => handleOpenNewTab("github")} rel='noopener' size='sm' variant='link'>
          <GithubIcon className='h-5 w-5' />
        </Button>
        <InfoDialog />
      </footer>
    </div>
  );
}

export default App;
