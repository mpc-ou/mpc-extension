import {
  AlertCircle,
  ArrowRightIcon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  TriangleAlert
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  _DEFAULT_ACADEMIC_RANKS,
  _DEFAULT_DRL_WARNING_THRESHOLD,
  _DEFAULT_EXCELLENT_GPA_THRESHOLD,
  _DEFAULT_IGNORE_SEMESTER_TITLE,
  _DEFAULT_MIN_TRAINING_POINT_SCHOLARSHIP
} from "@/constants/default";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/store/use-global-store";
import { useScoreStore } from "@/store/use-score-store";
import { useUserSettingsStore } from "@/store/use-user-settings-store";
import type { ScoreGroupType, ScoreRecordType } from "@/types";
import { getAcademicRank, getTrainingRank } from "@/utils/academic-compute";
import { getScoreSummary, isSameSubject } from "@/utils/score";

function buildImprovementSemesters(
  subjects: ScoreRecordType[],
  startId: number,
  maxCreditsPerSemester: number
): ScoreGroupType[] {
  const batches: ScoreRecordType[][] = [];
  let batch: ScoreRecordType[] = [];
  let batchCredits = 0;

  for (const sub of subjects) {
    if (batchCredits + sub.credit > maxCreditsPerSemester && batch.length > 0) {
      batches.push(batch);
      batch = [];
      batchCredits = 0;
    }
    batch.push(sub);
    batchCredits += sub.credit;
  }
  if (batch.length > 0) {
    batches.push(batch);
  }

  return batches.map((b, i) => {
    const tc = b.reduce((sum, sub) => sum + sub.credit, 0);
    return {
      id: startId + i + 1,
      title: `Cải thiện${batches.length > 1 ? ` ${i + 1}` : ""}`,
      trainingPoint: null,
      totalCredit: tc,
      avgPoint: { scale10: 10, scale4: 4.0 },
      data: b.map((sub) => ({
        code: sub.code,
        name: sub.name,
        credit: sub.credit,
        isIgnore: false,
        isImproved: true,
        point: { scale10: 10, scale4: 4.0, character: "A+" as const }
      }))
    };
  });
}

function markSubjectsIgnored(
  scores: ScoreGroupType[],
  selected: ScoreRecordType[],
  matchByName: boolean
): ScoreGroupType[] {
  return scores.map((sem) => ({
    ...sem,
    data: sem.data.map((sub) =>
      selected.some((s) => isSameSubject(s, sub, matchByName)) && (sub.point.scale4 ?? 0) < 4.0
        ? { ...sub, isIgnore: true, isImproved: true }
        : sub
    )
  }));
}

function isGpaEligible(sub: ScoreRecordType): boolean {
  if (sub.isIgnore || !sub.point.character) {
    return false;
  }
  const { credit, point } = sub;
  if (typeof credit !== "number" || typeof point.scale10 !== "number" || typeof point.scale4 !== "number") {
    return false;
  }
  return !(Number.isNaN(credit) || Number.isNaN(point.scale10) || Number.isNaN(point.scale4));
}

function renderDrlStatus(trainingPoint: number, rankLabel: string) {
  const formatted = trainingPoint.toFixed(0);
  if (trainingPoint < _DEFAULT_DRL_WARNING_THRESHOLD) {
    return (
      <>
        <ShieldAlert className='mt-0.5 h-4 w-4 shrink-0 text-red-500' />
        <span className='text-muted-foreground'>
          ĐRL <strong className='text-foreground'>{formatted}</strong> — dưới {_DEFAULT_DRL_WARNING_THRESHOLD}, nguy cơ
          bị cảnh báo. Cần tham gia ngoại khóa!
        </span>
      </>
    );
  }
  if (trainingPoint < _DEFAULT_MIN_TRAINING_POINT_SCHOLARSHIP) {
    return (
      <>
        <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-orange-500' />
        <span className='text-muted-foreground'>
          ĐRL <strong className='text-foreground'>{formatted}</strong> — chưa đủ xét học bổng (cần{" "}
          {_DEFAULT_MIN_TRAINING_POINT_SCHOLARSHIP}+).
        </span>
      </>
    );
  }
  return (
    <>
      <ShieldCheck className='mt-0.5 h-4 w-4 shrink-0 text-emerald-500' />
      <span className='text-muted-foreground'>
        ĐRL <strong className='text-foreground'>{formatted}</strong> — {rankLabel}, đủ học bổng, an toàn tốt nghiệp.
      </span>
    </>
  );
}

function getGraduationMessage(
  a: {
    remainingCredits: number;
    remainingSemesters: number;
    passedSemesters: number;
    semestersNeeded: number;
    canFinish: boolean;
  },
  trainingSemesters: number,
  maxCreditsPerSemester: number
): string {
  if (a.remainingCredits === 0) {
    return "🎉 Chúc mừng! Bạn đã đủ tín chỉ để tốt nghiệp.";
  }
  if (a.remainingSemesters <= 0) {
    return `⚠️ Bạn đã học ${a.passedSemesters}/${trainingSemesters} kỳ. Còn thiếu ${a.remainingCredits} TC, cần khoảng ${a.semestersNeeded} kỳ nữa. Học vượt hoặc đăng ký học hè để kịp tiến độ nhé.`;
  }
  if (a.canFinish) {
    return `✅ Bạn còn ${a.remainingSemesters} kỳ, cần thêm ${a.remainingCredits} TC. Với ${maxCreditsPerSemester} TC/kỳ, bạn sẽ hoàn thành trong ~${a.semestersNeeded} kỳ — đúng tiến độ.`;
  }
  return `⚠️ Cần ${a.remainingCredits} TC (~${a.semestersNeeded} kỳ) nhưng chỉ còn ${a.remainingSemesters} kỳ. Cân nhắc học vượt hoặc học hè nhé.`;
}

function getSuggestedSubjects(
  scores: ScoreGroupType[],
  improvableSubjects: ScoreRecordType[],
  targetGpa: number
): ScoreRecordType[] {
  const suggested: ScoreRecordType[] = [];
  if (targetGpa <= 0) {
    return suggested;
  }

  let sum4 = 0;
  let sumCr = 0;
  for (const sem of scores) {
    for (const sub of sem.data) {
      if (isGpaEligible(sub)) {
        sum4 += (sub.point.scale4 ?? 0) * sub.credit;
        sumCr += sub.credit;
      }
    }
  }

  let runSum4 = sum4;
  let runSumCr = sumCr;
  for (const sub of improvableSubjects) {
    if (isGpaEligible(sub)) {
      runSum4 += (4.0 - (sub.point.scale4 ?? 0)) * sub.credit;
    } else {
      runSum4 += 4.0 * sub.credit;
      runSumCr += sub.credit;
    }
    suggested.push(sub);
    if (runSumCr > 0 && runSum4 / runSumCr >= targetGpa) {
      break;
    }
  }
  return suggested;
}

function checkTargetReachability(
  scores: ScoreGroupType[],
  improvableSubjects: ScoreRecordType[],
  targetGpa: number,
  trainingSemesters: number,
  maxCreditsPerSemester: number,
  matchByName: boolean,
  currentGpa: number
): { bestPossibleGpa: number; isTargetUnreachable: boolean } {
  if (targetGpa <= 0 || improvableSubjects.length === 0) {
    return { bestPossibleGpa: currentGpa, isTargetUnreachable: false };
  }
  const maxId = scores.reduce((max, s) => Math.max(max, s.id), 0);
  const allIgnored = markSubjectsIgnored(scores, improvableSubjects, matchByName);
  const allNewSems = buildImprovementSemesters(improvableSubjects, maxId, maxCreditsPerSemester);
  const bestSummary = getScoreSummary([...allNewSems, ...allIgnored], trainingSemesters);
  const bestPossibleGpa = bestSummary.gpa4;
  return { bestPossibleGpa, isTargetUnreachable: bestPossibleGpa < targetGpa };
}

export function MascotAdvisor() {
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [improvedSubjects, setImprovedSubjects] = useState<Set<string>>(new Set());
  const [targetRankLabel, setTargetRankLabel] = useState<string>("");
  const scores = useScoreStore((s) => s.scores);
  const { settings: userSettings } = useUserSettingsStore();
  const maxCreditsPerSemester = useGlobalStore((s) => s.maxCreditsPerSemester);
  const matchByName = useGlobalStore((s) => s.matchSubjectByName);
  const totalProgramCredits = userSettings.totalProgramCredits;
  const trainingSemesters = userSettings.trainingSemesters;

  const summary = useMemo(() => getScoreSummary(scores, trainingSemesters), [scores, trainingSemesters]);
  const currentGpa = summary.gpa4;
  const currentCredit = summary.totalCredit;

  const currentRank = getAcademicRank(currentGpa);

  const higherRanks = useMemo(() => {
    if (currentGpa >= _DEFAULT_EXCELLENT_GPA_THRESHOLD) {
      return [];
    }
    return _DEFAULT_ACADEMIC_RANKS.filter((r) => r.minGpa4 > currentGpa).reverse();
  }, [currentGpa]);

  const targetGpa = useMemo(() => {
    const r = _DEFAULT_ACADEMIC_RANKS.find((r) => r.rank.label === targetRankLabel);
    return r ? r.minGpa4 : 0;
  }, [targetRankLabel]);

  const analysis = useMemo(() => {
    const remainingCredits = Math.max(0, totalProgramCredits - currentCredit);
    const maxPossibleGpa =
      remainingCredits > 0 ? (currentGpa * currentCredit + 4.0 * remainingCredits) / totalProgramCredits : currentGpa;

    const improvableSubjects = scores
      .flatMap((s) => s.data)
      .filter((sub) => !sub.isIgnore && (sub.point.scale4 ?? 0) < 4.0 && sub.point.character !== "M")
      .sort((a, b) => b.credit - a.credit);

    const suggestedSubjects = getSuggestedSubjects(scores, improvableSubjects, targetGpa);

    const { bestPossibleGpa, isTargetUnreachable } = checkTargetReachability(
      scores,
      improvableSubjects,
      targetGpa,
      trainingSemesters,
      maxCreditsPerSemester,
      matchByName,
      currentGpa
    );

    const top5LowSubjects = improvableSubjects
      .filter((s) => (s.point.scale10 ?? 0) < 7.0)
      .sort((a, b) => b.credit - a.credit || (a.point.scale10 ?? 0) - (b.point.scale10 ?? 0))
      .slice(0, 5);

    const lowSubjects = targetRankLabel ? suggestedSubjects : top5LowSubjects;

    const passedSemesters = scores.filter((s) => s.title !== _DEFAULT_IGNORE_SEMESTER_TITLE).length;
    const remainingSemesters = Math.max(0, trainingSemesters - passedSemesters);
    const maxCreditsPossible = remainingSemesters * maxCreditsPerSemester;
    const remaining = Math.max(0, totalProgramCredits - currentCredit);
    const canFinish = remainingSemesters > 0 && maxCreditsPossible >= remaining;
    const semestersNeeded = maxCreditsPerSemester > 0 ? Math.ceil(remaining / maxCreditsPerSemester) : 0;

    const currentTrainingPoint = summary.avgTrainingPoint;
    const trainingRank = getTrainingRank(currentTrainingPoint);

    return {
      remainingCredits: remaining,
      maxPossibleGpa,
      lowSubjects,
      currentTrainingPoint,
      trainingRank,
      currentRank,
      canFinish,
      semestersNeeded,
      remainingSemesters,
      passedSemesters,
      maxCreditsPossible,
      improvableCount: improvableSubjects.length,
      bestPossibleGpa,
      isTargetUnreachable
    };
  }, [
    scores,
    currentGpa,
    currentCredit,
    summary.avgTrainingPoint,
    totalProgramCredits,
    targetGpa,
    targetRankLabel,
    trainingSemesters,
    maxCreditsPerSemester,
    currentRank,
    matchByName
  ]);

  const simulation = useMemo(() => {
    if (improvedSubjects.size === 0 || currentCredit === 0) {
      return null;
    }

    const selectedKeys = new Set(improvedSubjects);
    const selected = analysis.lowSubjects.filter((s) => selectedKeys.has(`${s.code}-${s.name}`));
    if (selected.length === 0) {
      return null;
    }

    const updatedScores = markSubjectsIgnored(scores, selected, matchByName);
    const maxId = updatedScores.reduce((max, s) => Math.max(max, s.id), 0);
    const newSemesters = buildImprovementSemesters(selected, maxId, maxCreditsPerSemester);

    const simulatedSummary = getScoreSummary([...newSemesters, ...updatedScores], trainingSemesters);
    const improvedCredits = selected.reduce((sum, s) => sum + s.credit, 0);

    return {
      simulatedGpa: simulatedSummary.gpa4,
      simulatedRank: getAcademicRank(simulatedSummary.gpa4),
      gainedPoints: simulatedSummary.gpa4 - currentGpa,
      improvementCredits: improvedCredits
    };
  }, [
    improvedSubjects,
    analysis.lowSubjects,
    scores,
    currentGpa,
    trainingSemesters,
    maxCreditsPerSemester,
    currentCredit,
    matchByName
  ]);

  const toggleSubject = (code: string, name: string) => {
    const key = `${code}-${name}`;
    setImprovedSubjects((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (analysis.lowSubjects.length > 0) {
      setImprovedSubjects(new Set(analysis.lowSubjects.map((s) => `${s.code}-${s.name}`)));
    }
  }, [analysis.lowSubjects]);

  const applyQuickPlan = () => {
    const selected = analysis.lowSubjects.filter((s) => improvedSubjects.has(`${s.code}-${s.name}`));
    if (selected.length === 0) {
      return;
    }

    const totalCredits = selected.reduce((sum, s) => sum + s.credit, 0);
    const currentScores = useScoreStore.getState().scores;

    const updatedScores = markSubjectsIgnored(currentScores, selected, matchByName);
    const maxId = updatedScores.reduce((max, s) => Math.max(max, s.id), 0);
    const newSemesters = buildImprovementSemesters(selected, maxId, maxCreditsPerSemester);

    useScoreStore.getState().setScores([...newSemesters, ...updatedScores]);
    setOpen(false);
    resetDialog();
    toast.success(`Đã thêm ${newSemesters.length} học kỳ cải thiện (${totalCredits} TC) vào kế hoạch.`);
  };

  const resetDialog = () => {
    setOpen(false);
    setImprovedSubjects(new Set());
    setTargetRankLabel("");
  };

  return (
    <>
      <button
        aria-label='Mở góc cố vấn học tập'
        className='fixed right-4 bottom-4 z-50 cursor-pointer border-none bg-transparent p-0 transition-all duration-300'
        onClick={() => setOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        type='button'
      >
        <div
          className={cn(
            "relative h-36 w-36 transform transition-all duration-300",
            isHovered
              ? "-translate-x-2 -translate-y-4 scale-110 opacity-100 drop-shadow-2xl"
              : "translate-x-10 translate-y-10 scale-90 opacity-50 drop-shadow-md hover:scale-100"
          )}
        >
          <img
            alt='Advisor Mascot'
            className={cn(
              "h-full w-full object-contain transition-transform duration-300",
              !isHovered && "animate-[pulse_3s_ease-in-out_infinite]"
            )}
            height={144}
            src={isHovered ? "/imgs/2.png" : "/imgs/1.png"}
            width={144}
          />
        </div>
      </button>

      {open && (
        <div className='pointer-events-none fixed inset-0 z-[60]'>
          <div className='group pointer-events-auto absolute right-4 bottom-4 flex flex-col items-end gap-2'>
            <div className='hidden max-w-64 rounded-2xl rounded-br-sm border bg-card px-4 py-2.5 text-sm leading-relaxed shadow-lg group-hover:block'>
              <p className='text-muted-foreground'>
                Chào! Hiện tại <strong className='text-foreground'>{analysis.currentRank.label}</strong> (GPA{" "}
                {currentGpa.toFixed(2)}).
                {analysis.remainingCredits > 0 && (
                  <>
                    {" "}
                    Còn <strong className='text-foreground'>{analysis.remainingCredits} TC</strong>.
                  </>
                )}
                {analysis.maxPossibleGpa > currentGpa ? (
                  <>
                    {" "}
                    Nếu đạt <strong className='text-foreground'>A+</strong> các môn còn lại →{" "}
                    <strong className='text-foreground'>{getAcademicRank(analysis.maxPossibleGpa).label}</strong> (GPA{" "}
                    {analysis.maxPossibleGpa.toFixed(2)}).
                  </>
                ) : (
                  <> Đã đạt giới hạn tối đa!</>
                )}
              </p>
            </div>
            <img
              alt='Mascot'
              className='h-24 w-24 object-contain drop-shadow-lg'
              height={96}
              src='/imgs/onboarding-0.png'
              width={96}
            />
          </div>
        </div>
      )}

      <Dialog
        onOpenChange={(v) => {
          if (v) {
            setOpen(true);
          } else {
            resetDialog();
          }
        }}
        open={open}
      >
        <DialogContent className='max-h-[85vh] overflow-y-auto border bg-card p-6 shadow-xl sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle className='text-lg'>🧑‍🏫 Cố vấn học tập</DialogTitle>
          </DialogHeader>

          <div className='mb-4 grid grid-cols-2 gap-3'>
            <div className='rounded-lg border bg-muted/30 p-3'>
              <p className='mb-2 text-muted-foreground text-xs'>Hiện tại</p>
              <p className='font-bold text-xl'>
                {analysis.currentRank.emoji} {analysis.currentRank.label}
              </p>
              <p className='font-mono text-muted-foreground text-sm'>GPA {currentGpa.toFixed(2)}</p>
              <div className='mt-2 flex items-center gap-1.5 border-t pt-2 text-muted-foreground text-xs'>
                <Shield className='h-3.5 w-3.5' />
                ĐRL {analysis.currentTrainingPoint.toFixed(0)} — {analysis.trainingRank.label}
              </div>
            </div>
            <div className='rounded-lg border bg-muted/30 p-3'>
              <p className='mb-2 text-muted-foreground text-xs'>Tốt nhất có thể</p>
              <p className='font-bold text-xl'>
                {getAcademicRank(analysis.maxPossibleGpa).emoji} {getAcademicRank(analysis.maxPossibleGpa).label}
              </p>
              <p className='font-mono text-muted-foreground text-sm'>GPA {analysis.maxPossibleGpa.toFixed(2)}</p>
              <p className='mt-2 border-t pt-2 text-muted-foreground text-xs'>
                {analysis.remainingCredits > 0 ? `Nếu A+ ${analysis.remainingCredits} TC còn lại` : "Đã đủ tín chỉ"}
              </p>
            </div>
          </div>

          {/* ── DRL warning ── */}
          <div className='mb-4 rounded-lg border bg-muted/20 p-3 text-sm'>
            <p className='flex items-start gap-2'>
              {renderDrlStatus(analysis.currentTrainingPoint, analysis.trainingRank.label)}
            </p>
          </div>

          {higherRanks.length > 0 ? (
            <div className='mb-4'>
              <p className='mb-2 font-medium text-sm'>🎯 Bạn muốn cải thiện lên hạng nào?</p>
              <div className='flex flex-wrap gap-1.5'>
                <button
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    targetRankLabel ? "border-border hover:bg-muted" : "border-foreground/30 bg-foreground/10"
                  )}
                  onClick={() => {
                    setTargetRankLabel("");
                    setImprovedSubjects(new Set());
                  }}
                  type='button'
                >
                  📈 Tốt hơn?
                </button>
                {higherRanks.map((r) => (
                  <button
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      targetRankLabel === r.rank.label
                        ? "border-foreground/30 bg-foreground/10 font-medium"
                        : "border-border hover:bg-muted"
                    )}
                    key={r.rank.label}
                    onClick={() => {
                      setTargetRankLabel(targetRankLabel === r.rank.label ? "" : r.rank.label);
                      setImprovedSubjects(new Set());
                    }}
                    type='button'
                  >
                    {r.rank.emoji} {r.rank.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className='mb-4 rounded-lg border bg-muted/20 p-3 text-center text-sm'>
              <Star className='mx-auto mb-1 h-6 w-6 text-amber-500' />
              <p className='text-muted-foreground'>Bạn đang ở mức Xuất sắc — không còn hạng nào cao hơn!</p>
            </div>
          )}

          {analysis.lowSubjects.length > 0 && (
            <div>
              <div className='mb-2 flex items-center justify-between'>
                <p className='font-medium text-sm'>📚 {analysis.lowSubjects.length} môn đề xuất cải thiện</p>
                <span className='text-muted-foreground text-xs'>Ưu tiên: tín chỉ cao → điểm thấp</span>
              </div>
              <div className='max-h-48 space-y-1.5 overflow-y-auto rounded-lg border bg-muted/20 p-2'>
                {analysis.lowSubjects.map((sub) => {
                  const key = `${sub.code}-${sub.name}`;
                  const isChecked = improvedSubjects.has(key);
                  return (
                    <div
                      className={cn(
                        "flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        isChecked ? "bg-background shadow-sm" : "opacity-50"
                      )}
                      key={key}
                    >
                      <div className='flex min-w-0 items-center gap-2'>
                        <Checkbox
                          checked={isChecked}
                          className='h-3.5 w-3.5'
                          onCheckedChange={() => toggleSubject(sub.code, sub.name)}
                        />
                        <span className='truncate' title={sub.name}>
                          {sub.name}
                        </span>
                        <span className='shrink-0 text-muted-foreground text-xs'>({sub.credit} TC)</span>
                      </div>
                      <div className='flex shrink-0 items-center gap-2'>
                        <span
                          className={cn(
                            "min-w-7 rounded px-1.5 py-0.5 text-center font-mono text-xs",
                            (sub.point.scale10 ?? 0) < 5
                              ? "bg-red-500/10 text-red-600"
                              : "bg-amber-500/10 text-amber-600"
                          )}
                        >
                          {sub.point.character || "—"}
                        </span>
                        <span className='font-mono text-emerald-600 text-xs dark:text-emerald-400'>→ A+</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Target unreachable warning ── */}
              {analysis.isTargetUnreachable && targetRankLabel && (
                <div className='mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-500/10 p-3 text-sm dark:border-amber-700'>
                  <TriangleAlert className='mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400' />
                  <div className='text-muted-foreground'>
                    <p>
                      Chỉ có <strong className='text-foreground'>{analysis.improvableCount}</strong> môn khả dụng để cải
                      thiện. Tốt nhất đạt được:{" "}
                      <strong className='text-foreground'>{analysis.bestPossibleGpa.toFixed(2)}</strong> (
                      {getAcademicRank(analysis.bestPossibleGpa).label}).
                    </p>
                    <p className='mt-1'>
                      Không thể đạt <strong className='text-foreground'>{targetRankLabel}</strong> với dữ liệu hiện tại.
                    </p>
                  </div>
                </div>
              )}

              {improvedSubjects.size > 0 && simulation && (
                <div className='mt-3 rounded-lg border bg-muted/20 p-3'>
                  <div className='flex items-baseline gap-2'>
                    <span className='text-muted-foreground text-sm'>GPA dự kiến: </span>
                    <span className='text-muted-foreground text-sm line-through'>{currentGpa.toFixed(2)}</span>
                    <ArrowRightIcon className='h-3 w-3 text-muted-foreground' />
                    <span className='font-bold text-lg'>{simulation.simulatedGpa.toFixed(2)}</span>
                    <span className='text-muted-foreground text-xs'>({simulation.simulatedRank.label})</span>
                  </div>
                  <p className='mt-1 text-muted-foreground text-xs'>
                    {improvedSubjects.size} môn · {simulation.improvementCredits} TC cần cải thiện
                  </p>
                </div>
              )}
            </div>
          )}

          {analysis.lowSubjects.length > 0 && analysis.remainingCredits > 0 && (
            <div className='rounded-lg border bg-muted/20 p-3'>
              <p className='mb-2 font-medium text-sm'>📅 Tiến độ tốt nghiệp</p>
              <div className='grid grid-cols-2 gap-1 text-sm'>
                <span className='text-muted-foreground'>Đã qua:</span>
                <span>
                  {analysis.passedSemesters} / {trainingSemesters} kỳ
                </span>
                <span className='text-muted-foreground'>Cần thêm:</span>
                <span>{analysis.remainingCredits} TC</span>
                <span className='text-muted-foreground'>Tối đa/kỳ:</span>
                <span>{maxCreditsPerSemester} TC</span>
              </div>
              <p
                className={cn(
                  "mt-2 rounded-md px-2 py-1 text-xs",
                  analysis.canFinish
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                )}
              >
                {getGraduationMessage(analysis, trainingSemesters, maxCreditsPerSemester)}
              </p>
            </div>
          )}

          {analysis.lowSubjects.length > 0 && improvedSubjects.size > 0 && (
            <div className='border-t pt-4'>
              <Button className='w-full' onClick={applyQuickPlan} size='default'>
                <Sparkles className='mr-2 h-4 w-4' />
                Áp dụng kế hoạch nhanh ({improvedSubjects.size} môn)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
