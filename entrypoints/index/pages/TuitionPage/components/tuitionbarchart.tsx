import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { formatVNDCompact } from "@/utils/tuition-compute";

const chartConfig = {
  daThu: { label: "Đã thu", color: "oklch(0.72 0.188 51)" },
  conNo: { label: "Còn nợ", color: "oklch(0.65 0.2 25)" }
} satisfies ChartConfig;

export function TuitionBarChart({
  barData,
  hasDebt
}: {
  barData: { name: string; daThu: number; conNo: number }[];
  hasDebt: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Học phí theo học kỳ</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className='aspect-auto h-75 w-full' config={chartConfig}>
          <BarChart data={barData} margin={{ left: 0, right: 10, top: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis axisLine={false} dataKey='name' tickLine={false} tickMargin={10} />
            <YAxis
              axisLine={false}
              tickFormatter={(v) => formatVNDCompact(Number(v))}
              tickLine={false}
              tickMargin={10}
              width={60}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey='daThu' fill='var(--color-daThu)' name='Đã thu' radius={[4, 4, 0, 0]} />
            {hasDebt && <Bar dataKey='conNo' fill='var(--color-conNo)' name='Còn nợ' radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
