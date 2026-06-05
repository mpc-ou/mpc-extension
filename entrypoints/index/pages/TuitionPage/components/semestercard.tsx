import { ChevronDown, ChevronRight, GraduationCap } from "lucide-react";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { _TUITION_MAJOR_EXCLUDE_PREFIXES, _TUITION_SERVICE_CODES } from "@/constants/default";
import { cn } from "@/lib/utils";
import type { PairedReceiptGroup, ScholarshipType, SemesterTuitionDetail } from "@/types";
import { SCHOLARSHIP_OPTIONS } from "@/types/tuition";
import { formatVND, getScholarshipRate, isNonCreditItem } from "@/utils/tuition-compute";

const isServiceItem = (code: string) => _TUITION_SERVICE_CODES.includes(code);

function ReceiptGroupBlock({ group, showNonCredit }: { group: PairedReceiptGroup; showNonCredit: boolean }) {
  const displayItems = showNonCredit ? group.items : group.items.filter((i) => !isNonCreditItem(i.courseCode));
  const isPayment = group.receiptType === "A";

  return (
    <div>
      <div className='mb-2 space-y-0.5'>
        <div className='flex items-center gap-2'>
          <span className='rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400'>
            Phiếu nộp
          </span>
          <span className='text-muted-foreground text-xs'>
            #{group.receiptNumber} · {group.createdAt}
          </span>
          <span className='ml-auto font-semibold text-sm'>{formatVND(group.subtotal)}</span>
        </div>
        {group.linkedReceiptNumber && (
          <div className='flex items-center gap-2'>
            <span className='rounded bg-green-100 px-1.5 py-0.5 font-medium text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400'>
              Phiếu thu
            </span>
            <span className='text-muted-foreground text-xs'>
              #{group.linkedReceiptNumber} · {group.linkedReceiptDate}
            </span>
          </div>
        )}
      </div>

      {displayItems.length === 0 ? (
        <p className='py-2 text-center text-muted-foreground text-xs'>Không có môn học phần</p>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b text-muted-foreground'>
                <th className='py-1 pr-2 text-left font-medium'>Mã MH</th>
                <th className='py-1 pr-2 text-left font-medium'>Tên môn học</th>
                <th className='py-1 pr-2 text-center font-medium'>TC</th>
                <th className='py-1 text-right font-medium'>Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item, i) => {
                const dimmed = isNonCreditItem(item.courseCode);
                return (
                  <tr
                    className={cn("border-muted/50 border-b", dimmed && "text-muted-foreground/50")}
                    key={`${item.courseCode || "empty"}-${i}`}
                  >
                    <td className='py-1 pr-2 font-mono'>{item.courseCode || "—"}</td>
                    <td className='py-1 pr-2'>{item.courseName || "—"}</td>
                    <td className='py-1 pr-2 text-center'>{dimmed ? "—" : item.credits || "—"}</td>
                    <td className={cn("py-1 text-right", item.amount < 0 && "text-red-500")}>
                      {formatVND(item.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: semester card has scholarship selector + receipt display
export function SemesterCard({
  detail,
  idx,
  categoryFilter,
  showNonCredit,
  scholarship,
  setScholarship
}: {
  detail: SemesterTuitionDetail;
  idx: number;
  categoryFilter: string;
  showNonCredit: boolean;
  scholarship: ScholarshipType;
  setScholarship: (semesterName: string, type: ScholarshipType) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);

  const aReceipts = useMemo(() => detail.receiptGroups.filter((g) => g.receiptType === "A"), [detail.receiptGroups]);

  const pairedReceipts: PairedReceiptGroup[] = useMemo(() => {
    const bReceipts = detail.receiptGroups.filter((g) => g.receiptType === "B");
    return aReceipts.map((aGroup) => {
      const bGroup = bReceipts.find((b) => b.linkedPaymentNumber === aGroup.receiptNumber);
      if (bGroup) {
        return {
          ...aGroup,
          linkedReceiptNumber: bGroup.receiptNumber,
          linkedReceiptDate: bGroup.createdAt
        };
      }
      return { ...aGroup };
    });
  }, [aReceipts, detail.receiptGroups]);

  const filteredGroups = useMemo(() => {
    let groups = pairedReceipts;
    if (categoryFilter !== "tất cả") {
      groups = groups
        .map((g) => ({
          ...g,
          items: g.items.filter((item) => {
            const cat = isServiceItem(item.courseCode) ? "dịch vụ" : "học phí";
            return cat === categoryFilter;
          })
        }))
        .filter((g) => g.items.length > 0);
    }
    if (!showNonCredit) {
      groups = groups
        .map((g) => ({
          ...g,
          items: g.items.filter((item) => !isNonCreditItem(item.courseCode))
        }))
        .filter((g) => g.items.length > 0);
    }
    return groups;
  }, [pairedReceipts, categoryFilter, showNonCredit]);

  const totalAmount = filteredGroups.reduce((s, g) => s + g.subtotal, 0);
  let totalCredits = 0;
  let creditAmount = 0;
  let majorCredits = 0;
  let majorAmount = 0;
  for (const g of filteredGroups) {
    for (const item of g.items) {
      if (!isNonCreditItem(item.courseCode) && item.credits > 0) {
        totalCredits += item.credits;
        creditAmount += item.amount;
        if (!_TUITION_MAJOR_EXCLUDE_PREFIXES.some((p) => item.courseCode.startsWith(p))) {
          majorCredits += item.credits;
          majorAmount += item.amount;
        }
      }
    }
  }
  const avgPerCredit = totalCredits > 0 ? Math.round(creditAmount / totalCredits) : 0;
  const avgMajorPerCredit = majorCredits > 0 ? Math.round(majorAmount / majorCredits) : 0;
  const receiptCount = filteredGroups.length;

  return (
    <div className='rounded-lg border'>
      <button
        className='flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50'
        onClick={() => setExpanded(!expanded)}
        type='button'
      >
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm'>
          {idx + 1}
        </div>
        <div className='min-w-0 flex-1'>
          <p className='truncate font-medium text-sm'>{detail.semesterName}</p>
          <p className='text-muted-foreground text-xs'>
            {receiptCount} phiếu · {totalCredits} tín chỉ
          </p>
        </div>

        <button
          className='flex shrink-0 cursor-default items-center gap-1 border-0 bg-transparent p-0'
          onClick={(e) => e.stopPropagation()}
          type='button'
        >
          <GraduationCap className='h-3.5 w-3.5 text-amber-600' />
          <Select
            onValueChange={(v) =>
              setScholarship(detail.semesterName, v === "none" ? null : (v as NonNullable<ScholarshipType>))
            }
            value={scholarship ?? "none"}
          >
            <SelectTrigger className='h-7 w-32 text-[11px]'>
              <SelectValue placeholder='Không có' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none'>Không có</SelectItem>
              {SCHOLARSHIP_OPTIONS.map((opt) => (
                <SelectItem key={opt.type} value={opt.type}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </button>

        <div className='shrink-0 text-right'>
          <p className='font-semibold text-sm'>{formatVND(totalAmount)}</p>
          {avgMajorPerCredit > 0 && <p className='text-muted-foreground text-xs'>{formatVND(avgMajorPerCredit)}/tín</p>}
          {scholarship && (
            <p className='font-semibold text-[11px] text-amber-700 dark:text-amber-400'>
              +{formatVND(Math.round(totalAmount * getScholarshipRate(scholarship)))}
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronDown className='h-4 w-4 shrink-0 text-muted-foreground' />
        ) : (
          <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground' />
        )}
      </button>

      {expanded && (
        <div className='space-y-3 border-t px-4 py-3'>
          {filteredGroups.map((group) => (
            <ReceiptGroupBlock group={group} key={group.receiptLabel} showNonCredit={showNonCredit} />
          ))}
          {detail.bankAccount && <p className='text-muted-foreground text-xs'>{detail.bankAccount}</p>}

          <div className='flex flex-wrap gap-x-6 gap-y-1 rounded-md bg-muted/50 p-3 text-sm'>
            <span>
              <strong>{receiptCount}</strong> phiếu
            </span>
            <span>
              <strong>{totalCredits}</strong> tín chỉ
            </span>
            <span>
              <strong>{formatVND(totalAmount)}</strong> tổng
            </span>
            <span>
              <strong>{avgPerCredit > 0 ? formatVND(avgPerCredit) : "—"}</strong> /tín chỉ
            </span>
            {avgMajorPerCredit > 0 && avgMajorPerCredit !== avgPerCredit && (
              <span className='text-muted-foreground'>
                <strong className='text-foreground'>{formatVND(avgMajorPerCredit)}</strong> /tín (CN)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
