import { isAfter, isSameDay, parseISO, startOfDay } from "date-fns";
import { ArrowRightIcon, BookOpenIcon, CalendarIcon, WalletIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { _DEFAULT_IGNORE_SEMESTER_TITLE, _DEFAULT_SCORE_SUMMARY } from "@/constants/default";
import { useCalendarStore } from "@/store/use-calendar-store";
import { useGlobalStore } from "@/store/use-global-store";
import { useScoreStore } from "@/store/use-score-store";
import { useTuitionStore } from "@/store/use-tuition-store";
import { useUserSettingsStore } from "@/store/use-user-settings-store";
import type { CalendarEntry, ScoreGroupType, ScoreSummaryType } from "@/types";
import { getAcademicRank } from "@/utils/academic-compute";
import { shortSemesterName } from "@/utils/calendar-format";
import { computeScoreHash } from "@/utils/hash";
import { formatSemesterShort, GRADE_COLORS, getScoreSummary } from "@/utils/score";
import { formatVNDCompact } from "@/utils/tuition-compute";
import { AcademicStatus } from "./components/academic-status";
import { CreditProgress, GpaChart, GradeDistribution, TrainingChart } from "./components/charts";
import { GoalBanner } from "./components/goal-banner";
import { SummaryCards } from "./components/summary-cards";

const tuitionChartConfig = {
  collected: { label: "Đã nộp", color: "oklch(0.72 0.188 51)" }
} satisfies ChartConfig;

function DashboardPage() {
  const scores = useScoreStore((s) => s.scores);
  const originalScores = useScoreStore((s) => s.originalScores);
  const savedScoresHash = useScoreStore((s) => s.savedScoresHash);
  const tuitionSummary = useTuitionStore((s) => s.summary);
  const scheduleMap = useCalendarStore((s) => s.scheduleMap);
  const fixedPoint = useGlobalStore((s) => s.fixedPoint);
  const { settings: userSettings } = useUserSettingsStore();
  const trainingSemesters = userSettings.trainingSemesters;
  const totalProgramCredits = userSettings.totalProgramCredits;
  const targetCredit = totalProgramCredits;
  const [summary, setSummary] = useState<ScoreSummaryType>(_DEFAULT_SCORE_SUMMARY);

  const displayScores = originalScores.length > 0 ? originalScores : scores;

  const updateSummary = useCallback(
    (data: ScoreGroupType[]) => setSummary(getScoreSummary(data, trainingSemesters)),
    [trainingSemesters]
  );

  useEffect(() => {
    updateSummary(displayScores);
  }, [displayScores, updateSummary]);

  const rank = getAcademicRank(summary.gpa4);
  const originalHash = useMemo(() => computeScoreHash(originalScores), [originalScores]);
  const hasPlan = savedScoresHash !== "" && originalHash !== "" && savedScoresHash !== originalHash;
  const plannedSummary = useMemo(
    () => (hasPlan ? getScoreSummary(scores, trainingSemesters) : null),
    [hasPlan, scores, trainingSemesters]
  );

  const semestersReversed = [...displayScores].filter((sem) => sem.title !== _DEFAULT_IGNORE_SEMESTER_TITLE).reverse();

  const chartDataTerm = semestersReversed.map((sem, idx) => {
    const slice = semestersReversed.slice(0, idx + 1);
    const sum = getScoreSummary(slice, trainingSemesters);
    const validPts = slice.filter((s) => s.trainingPoint !== null && s.trainingPoint !== undefined);
    const cumulativeTraining =
      validPts.length === 0 ? 0 : validPts.reduce((a, b) => a + (b.trainingPoint ?? 0), 0) / validPts.length;
    return {
      term: formatSemesterShort(sem.title),
      gpa4: sem.avgPoint.scale4 ?? 0,
      cumulativeGpa4: sum.gpa4,
      training: sem.trainingPoint ?? 0,
      cumulativeTraining,
      credit: sem.totalCredit,
      cumulativeCredit: sum.totalCredit
    };
  });

  const gradeCount: Record<string, number> = {};
  for (const sem of displayScores) {
    for (const sub of sem.data) {
      if (sub.isIgnore || !sub.point.character) {
        continue;
      }
      gradeCount[sub.point.character] = (gradeCount[sub.point.character] || 0) + 1;
    }
  }

  const chartDataGrade = Object.keys(GRADE_COLORS)
    .filter((g) => (gradeCount[g] ?? 0) > 0)
    .map((g) => ({ grade: g, count: gradeCount[g] ?? 0, fill: GRADE_COLORS[g] }));
  const chartConfigGrade: ChartConfig = Object.keys(GRADE_COLORS).reduce(
    (acc, g) => {
      acc[g] = { label: g, color: GRADE_COLORS[g] };
      return acc;
    },
    { count: { label: "Số lượng" } } as ChartConfig
  );

  const tuitionChartData = useMemo(() => {
    if (tuitionSummary.length === 0) {
      return [];
    }
    return tuitionSummary
      .map((e) => ({
        name: shortSemesterName(e.semesterName),
        collected: e.collected
      }))
      .reverse(); // oldest on left
  }, [tuitionSummary]);

  const upcomingEvents = useMemo(() => {
    if (scheduleMap.size === 0) {
      return null;
    }
    const events: { date: Date; entry: CalendarEntry }[] = [];
    const today = startOfDay(new Date());

    for (const [dateKey, entries] of scheduleMap) {
      const date = parseISO(dateKey);
      if (isAfter(date, today) || isSameDay(date, today)) {
        for (const entry of entries) {
          events.push({ date, entry });
        }
      }
    }
    events.sort((a, b) => {
      const dateDiff = a.date.getTime() - b.date.getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return (a.entry.startTime || "").localeCompare(b.entry.startTime || "");
    });
    return events.slice(0, 11);
  }, [scheduleMap]);
  const dashboardUpcomingEvents = upcomingEvents?.slice(0, 10) ?? [];
  const hasMoreUpcomingEvents = (upcomingEvents?.length ?? 0) > 10;

  if (displayScores.length === 0) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center space-y-4'>
        <div className='mb-4 rounded-full bg-muted p-6'>
          <BookOpenIcon className='h-12 w-12 text-muted-foreground' />
        </div>
        <h2 className='font-semibold text-2xl'>Chưa có dữ liệu</h2>
        <p className='max-w-md text-center text-muted-foreground'>
          Vui lòng đến từng hạng mục thông tin và nhập dữ liệu của bạn. MPC sẽ tự động tổng hợp và hiển thị thông tin
          học tập của bạn tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {hasPlan && plannedSummary && (
        <GoalBanner currentGpa4={summary.gpa4} fixedPoint={fixedPoint} plannedGpa4={plannedSummary.gpa4} />
      )}

      <SummaryCards
        avgTrainingPoint={summary.avgTrainingPoint}
        fixedPoint={fixedPoint}
        gpa4={summary.gpa4}
        gpa10={summary.gpa10}
        semesterCount={summary.semesterCount}
        totalCredit={summary.totalCredit}
        totalSubject={summary.totalSubject ?? 0}
        trainingSemesters={trainingSemesters}
      />

      <AcademicStatus gpa4={summary.gpa4} rank={rank} />

      <div className='grid gap-6 lg:grid-cols-2'>
        <GpaChart data={chartDataTerm} />
        <TrainingChart data={chartDataTerm} />
        <GradeDistribution config={chartConfigGrade} data={chartDataGrade} />
        <CreditProgress
          data={chartDataTerm}
          targetCredit={targetCredit}
          totalCredit={summary.totalCredit}
          totalProgramCredits={totalProgramCredits}
        />
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <CalendarIcon className='h-4 w-4 text-primary' />
              Sự kiện sắp tới
            </CardTitle>
          </CardHeader>
          <CardContent className='max-h-80 space-y-1 overflow-y-auto'>
            {dashboardUpcomingEvents.length > 0 ? (
              <>
                {dashboardUpcomingEvents.map((ev, i) => (
                  <div
                    className='flex items-start gap-2 border-muted border-b py-1.5 text-sm last:border-0'
                    key={`${ev.date.toISOString()}-${i}`}
                  >
                    <span className='shrink-0 font-medium text-muted-foreground text-xs'>
                      {ev.date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    </span>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium'>{ev.entry.title}</p>
                      <p className='text-muted-foreground text-xs'>
                        {ev.entry.startTime}
                        {ev.entry.endTime ? ` - ${ev.entry.endTime}` : ""} · {ev.entry.room}
                      </p>
                    </div>
                  </div>
                ))}
                {hasMoreUpcomingEvents && (
                  <a
                    className='mt-3 flex w-full items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 font-medium text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground'
                    href='#calendar'
                  >
                    <CalendarIcon className='h-4 w-4' />
                    Xem chi tiết trong Lịch học tập
                  </a>
                )}
              </>
            ) : (
              <div className='flex h-40 items-center justify-center text-muted-foreground text-sm'>
                Chưa có lịch học
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <WalletIcon className='h-4 w-4 text-primary' />
              Đã nộp cho trường từng kỳ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tuitionChartData.length > 0 ? (
              <>
                <ChartContainer className='aspect-auto h-64 w-full' config={tuitionChartConfig}>
                  <BarChart data={tuitionChartData} margin={{ left: 0, right: 10, top: 10 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis axisLine={false} dataKey='name' tickLine={false} tickMargin={8} />
                    <YAxis
                      axisLine={false}
                      tickFormatter={(v) => formatVNDCompact(Number(v))}
                      tickLine={false}
                      tickMargin={8}
                      width={65}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey='collected' fill='var(--color-collected)' name='Đã nộp' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
                <Button
                  className='mt-3 w-full'
                  onClick={() => {
                    window.location.hash = "tuition";
                  }}
                  size='sm'
                  variant='outline'
                >
                  <ArrowRightIcon className='mr-2 h-4 w-4' />
                  Xem học phí
                </Button>
              </>
            ) : (
              <div className='flex h-40 items-center justify-center text-muted-foreground text-sm'>
                Chưa có dữ liệu học phí
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { DashboardPage };
