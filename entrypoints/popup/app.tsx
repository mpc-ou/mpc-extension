import { Activity, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { _FACEBOOK_URL, _GITHUB_URL } from "@/constants";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { _TAB_CATE, _SITE_CATE } from "@/entrypoints/popup/type"; // Ensure _SITE_CATE is imported if used
import { useGlobalStore } from "@/store/use-global-store";
import { getCurrTabURL, openNewTab } from "@/utils";
import { InfoTab } from "./InfoTab";
import { PointTab } from "./PointTab";
import { StatisticTab } from "./StatisticTab";
import ConfigTab from '@/components/ConfigTab';

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
      let siteCurr: _SITE_CATE = "sv"; // Ensure _SITE_CATE type is valid here

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
          <TabsTrigger value='statistic'>Thống kê</TabsTrigger>
          {/* NEW BUTTON HERE */}
          <TabsTrigger value='config'>Cấu hình</TabsTrigger>
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
          {/* NEW TAB CONTENT HERE */}
          <TabsContent value='config'>
            <ConfigTab />
          </TabsContent>
        </Activity>
      </Tabs>

      <footer className='mt-4 flex items-center justify-center bg-secondary py-2 text-md text-primary'>
        © 2025, 2026 by MPC. Made with ❤️ for students of OU.
        <Button onClick={() => handleOpenNewTab("fb")} rel='noopener' size='sm' variant='link'>
          Facebook
        </Button>
        <Button onClick={() => handleOpenNewTab("github")} rel='noopener' size='sm' variant='link'>
          Github
        </Button>
      </footer>
    </div>
  );
}

export default App;