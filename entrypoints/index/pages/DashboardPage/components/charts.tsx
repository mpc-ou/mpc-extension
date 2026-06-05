import { Area, Bar, CartesianGrid, ComposedChart, LabelList, Line, Pie, PieChart, XAxis, YAxis } from "recharts";
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

type ChartTermData = {
  term: string;
  gpa4: number;
  cumulativeGpa4: number;
  training: number;
  cumulativeTraining: number;
  credit: number;
  cumulativeCredit: number;
};

export function GpaChart({ data }: { data: ChartTermData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Điểm TB học kỳ (Hệ 4) & GPA tích lũy</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className='aspect-auto h-75 w-full'
          config={{
            gpa4: { label: "ĐTB Hệ 4 (kỳ)", color: "oklch(0.6 0.2 260)" },
            cumulativeGpa4: { label: "GPA tích lũy", color: "oklch(0.7 0.19 56)" }
          }}
        >
          <ComposedChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis axisLine={false} dataKey='term' tickLine={false} tickMargin={10} />
            <YAxis axisLine={false} domain={[0, 4]} tickLine={false} tickMargin={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey='gpa4'
              fill='var(--color-gpa4)'
              fillOpacity={0.15}
              stroke='var(--color-gpa4)'
              strokeWidth={2}
              type='monotone'
            />
            <Line
              activeDot={{ r: 6 }}
              dataKey='cumulativeGpa4'
              dot={{ r: 4 }}
              stroke='var(--color-cumulativeGpa4)'
              strokeDasharray='5 5'
              strokeWidth={2}
              type='monotone'
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function TrainingChart({ data }: { data: ChartTermData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Điểm rèn luyện từng kỳ & ĐRL tích lũy</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className='aspect-auto h-75 w-full'
          config={{
            training: { label: "ĐRL từng kỳ", color: "oklch(0.6 0.2 150)" },
            cumulativeTraining: { label: "ĐRL tích lũy", color: "oklch(0.7 0.19 56)" }
          }}
        >
          <ComposedChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
            <CartesianGrid vertical={false} />
            <XAxis axisLine={false} dataKey='term' tickLine={false} tickMargin={10} />
            <YAxis axisLine={false} domain={[0, 100]} tickLine={false} tickMargin={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey='training' fill='var(--color-training)' fillOpacity={0.8} radius={[4, 4, 0, 0]} />
            <Line
              activeDot={{ r: 6 }}
              dataKey='cumulativeTraining'
              dot={{ r: 4 }}
              stroke='var(--color-cumulativeTraining)'
              strokeDasharray='5 5'
              strokeWidth={2}
              type='monotone'
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function GradeDistribution({
  data,
  config
}: {
  data: { grade: string; count: number; fill: string }[];
  config: ChartConfig;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Phân bổ điểm số</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className='aspect-auto h-95 w-full' config={config}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey='count' innerRadius={20} nameKey='grade' paddingAngle={2} strokeWidth={3}>
              <LabelList dataKey='grade' fill='#fff' fontSize={12} fontWeight='bold' position='inside' stroke='none' />
            </Pie>
            <ChartLegend className='flex-wrap gap-2 pt-6' content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function CreditProgress({
  data,
  totalCredit,
  targetCredit,
  totalProgramCredits,
  tuitionData
}: {
  data: ChartTermData[];
  totalCredit: number;
  targetCredit: number;
  totalProgramCredits: number;
  tuitionData?: { term: string; tuition: number }[];
}) {
  const hasTuition = tuitionData && tuitionData.length > 0;
  const chartConfig = {
    credit: { label: "TC từng kỳ", color: "oklch(0.6 0.2 200)" },
    ...(hasTuition ? ({ tuition: { label: "Đã nộp", color: "oklch(0.65 0.18 30)" } } as ChartConfig) : {})
  } as ChartConfig;
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Tiến độ tín chỉ tích lũy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='flex items-end justify-between'>
            <div>
              <p className='font-bold text-4xl'>{totalCredit}</p>
              <p className='text-muted-foreground text-sm'>/ {targetCredit} TC mục tiêu</p>
            </div>
            <p className='font-semibold text-2xl text-primary'>
              {Math.min(100, (totalCredit / targetCredit) * 100).toFixed(1)}%
            </p>
          </div>
          <div className='relative h-6 w-full overflow-hidden rounded-full bg-muted'>
            <div
              className='h-full rounded-full bg-linear-to-r from-primary/80 to-primary transition-all duration-700'
              style={{ width: `${Math.min(100, (totalCredit / targetCredit) * 100)}%` }}
            />
            <div
              className='absolute top-0 h-full w-0.5 bg-foreground/30'
              style={{ left: `${(totalProgramCredits / targetCredit) * 100}%` }}
            />
          </div>
          <div className='flex justify-between text-muted-foreground text-xs'>
            <span>0 TC</span>
            <span className='font-medium'>{totalProgramCredits} TC (CTĐT)</span>
            <span>135 TC</span>
          </div>
          <div className='mt-8'>
            <ChartContainer className='aspect-auto h-62.5 w-full' config={chartConfig}>
              <ComposedChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
                <CartesianGrid vertical={false} />
                <XAxis axisLine={false} dataKey='term' tickLine={false} tickMargin={10} />
                <YAxis axisLine={false} tickLine={false} tickMargin={10} yAxisId='left' />
                {hasTuition && (
                  <YAxis
                    axisLine={false}
                    orientation='right'
                    tickFormatter={(v) => formatVNDCompact(Number(v))}
                    tickLine={false}
                    tickMargin={10}
                    yAxisId='right'
                  />
                )}
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey='credit'
                  fill='var(--color-credit)'
                  maxBarSize={40}
                  name='TC từng kỳ'
                  radius={[4, 4, 0, 0]}
                  yAxisId='left'
                />
                {hasTuition && (
                  <Line
                    dataKey='tuition'
                    dot={{ fill: "var(--color-tuition)", r: 4 }}
                    name='Đã nộp'
                    stroke='var(--color-tuition)'
                    strokeWidth={2}
                    type='monotone'
                    yAxisId='right'
                  />
                )}
              </ComposedChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
