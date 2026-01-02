import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTab } from "./InfoTab";
import { PointTab } from "./PointTab";
import { StatisticTab } from "./StatisticTab";

function App() {
  return (
    <div className='min-w-180 pb-4'>
      <Tabs defaultValue='point'>
        <TabsList className='w-full'>
          <TabsTrigger value='point'>Tính điểm</TabsTrigger>
          <TabsTrigger value='info'>Thông tin</TabsTrigger>
          <TabsTrigger value='statistic'>Thống kê</TabsTrigger>
        </TabsList>

        <TabsContent value='point'>
          <PointTab />
        </TabsContent>
        <TabsContent value='info'>
          <InfoTab />
        </TabsContent>
        <TabsContent value='statistic'>
          <StatisticTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
