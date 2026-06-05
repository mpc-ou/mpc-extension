import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
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
  avg: { label: "Trung bình", color: "oklch(0.72 0.188 51)" },
  min: { label: "Thấp nhất", color: "oklch(0.65 0.2 25)" },
  max: { label: "Cao nhất", color: "oklch(0.72 0.188 151)" }
} satisfies ChartConfig;

export function CreditCostChart({
  data
}: {
  data: { name: string; avg: number; avgMajor: number; min: number; max: number }[];
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Đơn giá / tín chỉ theo kỳ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex h-75 items-center justify-center text-muted-foreground text-sm'>
            Chưa có dữ liệu chi tiết để tính đơn giá
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Đơn giá / tín chỉ theo kỳ</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className='aspect-auto h-75 w-full' config={chartConfig}>
          <ComposedChart data={data} margin={{ left: 0, right: 10, top: 10 }}>
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
            <Bar dataKey='min' fill='var(--color-min)' name='Thấp nhất' radius={[4, 4, 0, 0]} />
            <Bar dataKey='max' fill='var(--color-max)' name='Cao nhất' radius={[4, 4, 0, 0]} />
            <Line
              dataKey='avg'
              dot={{ fill: "var(--color-avg)", r: 4 }}
              name='Trung bình'
              stroke='var(--color-avg)'
              strokeWidth={2}
              type='monotone'
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
