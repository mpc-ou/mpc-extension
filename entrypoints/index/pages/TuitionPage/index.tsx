import { Download, InfoIcon, Landmark, Trash2 } from "lucide-react";
import { useDeferredValue, useMemo, useReducer } from "react";
import { toast } from "sonner";
import huongDanHocPhiMd from "@/assets/docs/huong_dan_hoc_phi.md?raw";
import { MarkdownModal } from "@/components/custom/markdown-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { _DEFAULT_IGNORE_SUBJECT_DATA, _DEFAULT_TUITION_MAJOR_EXCLUDE_PREFIXES } from "@/constants/default";
import { useConfirm } from "@/hooks/use-confirm";
import { useTuitionStore } from "@/store/use-tuition-store";
import type { SemesterTuitionDetail } from "@/types";
import { shortSemesterName } from "@/utils/calendar-format";
import { computeScholarshipRefund, computeTuitionStats } from "@/utils/tuition-compute";
import { handleExportTuitionData } from "@/utils/tuition-export";
import { flattenDetails } from "./components/allitemstable";
import { CreditCostChart } from "./components/creditcostchart";
import { DetailSection } from "./components/detailsection";
import { TuitionStatCards } from "./components/statcards";
import { TuitionBarChart } from "./components/tuitionbarchart";

const isIgnoredForCredit = (code: string) =>
  code.startsWith("_") || _DEFAULT_IGNORE_SUBJECT_DATA.some((p) => code.includes(p));

type SortKey = "courseCode" | "courseName" | "credits" | "amount" | "semesterName";
type SortDir = "asc" | "desc";

function collectRates(detail: SemesterTuitionDetail) {
  const rates: number[] = [];
  const ratesMajor: number[] = [];
  for (const group of detail.receiptGroups) {
    if (group.receiptType === "B") {
      continue;
    }
    for (const item of group.items) {
      if (isIgnoredForCredit(item.courseCode) || !(item.credits > 0 && item.amount > 0)) {
        continue;
      }
      const rate = item.amount / item.credits;
      rates.push(rate);
      if (!_DEFAULT_TUITION_MAJOR_EXCLUDE_PREFIXES.some((p) => item.courseCode.startsWith(p))) {
        ratesMajor.push(rate);
      }
    }
  }
  return { rates, ratesMajor };
}

function buildCreditCostData(
  summary: { semesterName: string }[],
  details: Record<string, SemesterTuitionDetail>
): { name: string; avg: number; avgMajor: number; min: number; max: number }[] {
  const result: { name: string; avg: number; avgMajor: number; min: number; max: number }[] = [];
  for (const entry of summary) {
    const detail = details[entry.semesterName];
    if (!detail) {
      continue;
    }
    const { rates, ratesMajor } = collectRates(detail);
    if (rates.length === 0) {
      continue;
    }
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    result.push({
      name: shortSemesterName(entry.semesterName),
      avg: avg(rates),
      avgMajor: ratesMajor.length > 0 ? avg(ratesMajor) : 0,
      min: Math.round(Math.min(...rates)),
      max: Math.round(Math.max(...rates))
    });
  }
  return result;
}

type TableState = {
  viewMode: "grouped" | "all";
  categoryFilter: string;
  showNonCredit: boolean;
  searchQuery: string;
  sortKey: SortKey;
  sortDir: SortDir;
  guideOpen: boolean;
};

type TableAction =
  | { type: "SET_VIEW_MODE"; payload: "grouped" | "all" }
  | { type: "SET_CATEGORY"; payload: string }
  | { type: "TOGGLE_NON_CREDIT" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_SORT"; payload: SortKey }
  | { type: "TOGGLE_GUIDE" };

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_CATEGORY":
      return { ...state, categoryFilter: action.payload };
    case "TOGGLE_NON_CREDIT":
      return { ...state, showNonCredit: !state.showNonCredit };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SET_SORT":
      return {
        ...state,
        sortKey: action.payload,
        sortDir: state.sortKey === action.payload && state.sortDir === "asc" ? "desc" : "asc"
      };
    case "TOGGLE_GUIDE":
      return { ...state, guideOpen: !state.guideOpen };
    default:
      return state;
  }
}

export function TuitionPage() {
  const summary = useTuitionStore((s) => s.summary);
  const details = useTuitionStore((s) => s.details);
  const scholarships = useTuitionStore((s) => s.scholarships);
  const setScholarship = useTuitionStore((s) => s.setScholarship);
  const lastUpdate = useTuitionStore((s) => s.lastUpdate);

  const [table, dispatch] = useReducer(tableReducer, {
    viewMode: "grouped",
    categoryFilter: "tất cả",
    showNonCredit: true,
    searchQuery: "",
    sortKey: "courseCode" as SortKey,
    sortDir: "asc" as SortDir,
    guideOpen: false
  });
  const deferredQuery = useDeferredValue(table.searchQuery);
  const confirm = useConfirm();

  const stats = useMemo(() => computeTuitionStats(summary, details), [summary, details]);
  const scholarshipRefund = useMemo(() => computeScholarshipRefund(summary, scholarships), [summary, scholarships]);
  const hasData = summary.length > 0;

  const allItems = useMemo(() => flattenDetails(details, table.categoryFilter), [details, table.categoryFilter]);
  const filteredItems = useMemo(() => {
    if (!deferredQuery.trim()) {
      return allItems;
    }
    const q = deferredQuery.toLowerCase();
    return allItems.filter((i) => i.courseCode.toLowerCase().includes(q) || i.courseName.toLowerCase().includes(q));
  }, [allItems, deferredQuery]);

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      const va = a[table.sortKey];
      const vb = b[table.sortKey];
      if (typeof va === "string" && typeof vb === "string") {
        return table.sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return table.sortDir === "asc" ? (Number(va) || 0) - (Number(vb) || 0) : (Number(vb) || 0) - (Number(va) || 0);
    });
    return sorted;
  }, [filteredItems, table.sortKey, table.sortDir]);

  const barData = useMemo(() => {
    return summary.map((entry) => ({
      name: shortSemesterName(entry.semesterName),
      daThu: entry.collected,
      conNo: entry.debt
    }));
  }, [summary]);

  const creditCostLineData = useMemo(() => buildCreditCostData(summary, details), [summary, details]);

  if (!hasData) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center space-y-4'>
        <div className='mb-4 rounded-full bg-muted p-6'>
          <Landmark className='h-12 w-12 text-muted-foreground' />
        </div>
        <h2 className='font-semibold text-2xl'>Chưa có dữ liệu học phí</h2>
        <p className='mb-6 max-w-md text-center text-muted-foreground'>
          Mở popup extension khi đang ở trang học phí trên cổng tiện ích sinh viên để nhập dữ liệu.
        </p>
        <Button onClick={() => dispatch({ type: "TOGGLE_GUIDE" })} variant='outline'>
          <InfoIcon className='mr-2 h-4 w-4' />
          Hướng dẫn nhập học phí
        </Button>
        <MarkdownModal
          isOpen={table.guideOpen}
          markdownContent={huongDanHocPhiMd}
          onClose={() => dispatch({ type: "TOGGLE_GUIDE" })}
          title='Hướng dẫn nhập học phí'
        />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <div className='flex items-center justify-between'>
          <h1 className='flex items-center gap-2 font-bold text-2xl tracking-tight'>
            Học phí
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className='h-4 w-4 cursor-help text-muted-foreground' />
              </TooltipTrigger>
              <TooltipContent side='right'>
                <p className='max-w-64 text-xs'>
                  Dữ liệu được thu thập tự động từ cổng tiện ích sinh viên. Các số liệu chỉ mang tính tương đối, có thể
                  không chính xác tuyệt đối do cách phân loại và tính toán của extension.
                </p>
              </TooltipContent>
            </Tooltip>
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='outline'>
                <Download className='mr-2 h-4 w-4' />
                Thao tác
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => handleExportTuitionData(summary, details)}>
                <Download className='mr-2 h-4 w-4' />
                Xuất Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  const isConfirmed = await confirm({
                    title: "Xác nhận xóa dữ liệu",
                    description: "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu học phí? Hành động này không thể hoàn tác.",
                    confirmText: "Xóa học phí",
                    variant: "destructive"
                  });
                  if (isConfirmed) {
                    await useTuitionStore.getState().clearData();
                    toast.success("Đã xóa dữ liệu học phí");
                  }
                }}
              >
                <Trash2 className='mr-2 h-4 w-4 text-red-500' />
                Xóa học phí
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {lastUpdate && (
          <p className='mt-1 text-muted-foreground text-sm'>
            Cập nhật lần cuối:{" "}
            {lastUpdate.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        )}
      </div>

      <TuitionStatCards scholarshipRefund={scholarshipRefund} stats={stats} />

      <div className='grid gap-6 lg:grid-cols-2'>
        <TuitionBarChart barData={barData} hasDebt={stats.totalDebt > 0} />
        <CreditCostChart data={creditCostLineData} />
      </div>

      <DetailSection
        categoryFilter={table.categoryFilter}
        details={details}
        handleSort={(key: SortKey) => dispatch({ type: "SET_SORT", payload: key })}
        scholarships={scholarships}
        searchQuery={table.searchQuery}
        setCategoryFilter={(v: string) => dispatch({ type: "SET_CATEGORY", payload: v })}
        setScholarship={setScholarship}
        setSearchQuery={(v: string) => dispatch({ type: "SET_SEARCH", payload: v })}
        setShowNonCredit={() => dispatch({ type: "TOGGLE_NON_CREDIT" })}
        setViewMode={(v: "grouped" | "all") => dispatch({ type: "SET_VIEW_MODE", payload: v })}
        showNonCredit={table.showNonCredit}
        sortDir={table.sortDir}
        sortedItems={sortedItems}
        sortKey={table.sortKey}
        summary={summary}
        viewMode={table.viewMode}
      />
      <MarkdownModal
        isOpen={table.guideOpen}
        markdownContent={huongDanHocPhiMd}
        onClose={() => dispatch({ type: "TOGGLE_GUIDE" })}
        title='Hướng dẫn nhập học phí'
      />
    </div>
  );
}
