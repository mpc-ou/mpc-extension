import { _TUITION_SERVICE_CODES } from "@/constants/default";
import { cn } from "@/lib/utils";
import type { SemesterTuitionDetail, TuitionReceiptItem } from "@/types";
import { shortSemesterName } from "@/utils/calendar-format";
import { formatVND, isNonCreditItem } from "@/utils/tuition-compute";

export type FlatItem = TuitionReceiptItem & {
  semesterName: string;
  category: "học phí" | "dịch vụ";
};

type SortKey = "courseCode" | "courseName" | "credits" | "amount" | "semesterName";
type SortDir = "asc" | "desc";

function SortHeader({
  col,
  label,
  className,
  sortKey,
  sortDir,
  handleSort
}: {
  col: SortKey;
  label: string;
  className?: string;
  sortKey: SortKey;
  sortDir: SortDir;
  handleSort: (key: SortKey) => void;
}) {
  let icon = "↕";
  if (sortKey === col) {
    icon = sortDir === "asc" ? "↑" : "↓";
  }
  const dimmed = sortKey !== col ? "text-muted-foreground/40" : "";
  return (
    <th
      className={cn("cursor-pointer py-2 pr-3 font-medium text-sm hover:text-foreground", className)}
      onClick={() => handleSort(col)}
    >
      {label}
      <span className={`ml-1 ${dimmed}`}>{icon}</span>
    </th>
  );
}

export function flattenDetails(details: Record<string, SemesterTuitionDetail>, categoryFilter: string): FlatItem[] {
  const result: FlatItem[] = [];
  const isService = (code: string) => _TUITION_SERVICE_CODES.includes(code);
  for (const detail of Object.values(details)) {
    for (const group of detail.receiptGroups) {
      if (group.receiptType === "B") {
        continue;
      }
      for (const item of group.items) {
        const cat = isService(item.courseCode) ? ("dịch vụ" as const) : ("học phí" as const);
        if (categoryFilter !== "tất cả" && cat !== categoryFilter) {
          continue;
        }
        result.push({ ...item, semesterName: detail.semesterName, category: cat });
      }
    }
  }
  return result;
}

export function AllItemsTable({
  items,
  showNonCredit,
  sortKey,
  sortDir,
  handleSort
}: {
  items: FlatItem[];
  showNonCredit: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  handleSort: (key: SortKey) => void;
}) {
  const displayItems = showNonCredit ? items : items.filter((i) => !isNonCreditItem(i.courseCode));

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b text-muted-foreground'>
            <SortHeader col='courseCode' handleSort={handleSort} label='Mã MH' sortDir={sortDir} sortKey={sortKey} />
            <SortHeader
              col='courseName'
              handleSort={handleSort}
              label='Tên môn học'
              sortDir={sortDir}
              sortKey={sortKey}
            />
            <SortHeader
              className='hidden md:table-cell'
              col='semesterName'
              handleSort={handleSort}
              label='Học kỳ'
              sortDir={sortDir}
              sortKey={sortKey}
            />
            <SortHeader
              className='text-center'
              col='credits'
              handleSort={handleSort}
              label='TC'
              sortDir={sortDir}
              sortKey={sortKey}
            />
            <SortHeader
              className='text-right'
              col='amount'
              handleSort={handleSort}
              label='Số tiền'
              sortDir={sortDir}
              sortKey={sortKey}
            />
            <th className='py-2 text-center font-medium text-sm'>Loại</th>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((item, i) => {
            const dimmed = isNonCreditItem(item.courseCode);
            return (
              <tr
                className={cn("border-muted/50 border-b hover:bg-muted/30", dimmed && "text-muted-foreground/50")}
                key={`${item.courseCode}-${item.semesterName}-${i}`}
              >
                <td className='py-1.5 pr-3 font-mono text-sm'>{item.courseCode || "—"}</td>
                <td className='py-1.5 pr-3 text-sm'>{item.courseName || "—"}</td>
                <td className='hidden py-1.5 pr-3 text-muted-foreground text-sm md:table-cell'>
                  {shortSemesterName(item.semesterName)}
                </td>
                <td className='py-1.5 pr-3 text-center text-sm'>{dimmed ? "—" : item.credits || "—"}</td>
                <td className={cn("py-1.5 text-right text-sm", item.amount < 0 && "text-red-500")}>
                  {formatVND(item.amount)}
                </td>
                <td className='py-1.5 text-center'>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs",
                      item.category === "dịch vụ"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    )}
                  >
                    {item.category === "dịch vụ" ? "Dịch vụ" : "Học phí"}
                  </span>
                </td>
              </tr>
            );
          })}
          {displayItems.length === 0 && (
            <tr>
              <td className='py-8 text-center text-muted-foreground' colSpan={6}>
                Không có dữ liệu phù hợp
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
