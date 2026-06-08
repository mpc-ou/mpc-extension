import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { _DEFAULT_TUITION_CATEGORIES } from "@/constants/default";
import type { ScholarshipType, SemesterTuitionDetail } from "@/types";
import type { FlatItem } from "./allitemstable";
import { AllItemsTable } from "./allitemstable";
import { SemesterCard } from "./semestercard";

type SortKey = "courseCode" | "courseName" | "credits" | "amount" | "semesterName";
type SortDir = "asc" | "desc";

const CATEGORY_LABELS: Record<string, string> = { "tất cả": "Tất cả", "học phí": "Học phí", "dịch vụ": "Dịch vụ" };

export function DetailSection({
  details,
  summary,
  scholarships,
  setScholarship,
  viewMode,
  setViewMode,
  categoryFilter,
  setCategoryFilter,
  showNonCredit,
  setShowNonCredit,
  searchQuery,
  setSearchQuery,
  sortedItems,
  sortKey,
  sortDir,
  handleSort
}: {
  details: Record<string, SemesterTuitionDetail>;
  summary: { semesterName: string }[];
  scholarships: Record<string, ScholarshipType>;
  setScholarship: (semesterName: string, type: ScholarshipType) => Promise<void>;
  viewMode: "grouped" | "all";
  setViewMode: (v: "grouped" | "all") => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  showNonCredit: boolean;
  setShowNonCredit: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortedItems: FlatItem[];
  sortKey: SortKey;
  sortDir: SortDir;
  handleSort: (key: SortKey) => void;
}) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <CardTitle className='text-base'>Chi tiết học phí</CardTitle>
          <div className='flex items-center gap-2'>
            <Select onValueChange={(v) => setCategoryFilter(v)} value={categoryFilter}>
              <SelectTrigger className='h-8 w-28 text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {_DEFAULT_TUITION_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs onValueChange={(v) => setViewMode(v as "grouped" | "all")} value={viewMode}>
              <TabsList className='h-8'>
                <TabsTrigger className='text-xs' value='grouped'>
                  Theo kỳ
                </TabsTrigger>
                <TabsTrigger className='text-xs' value='all'>
                  Tất cả
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className='flex cursor-pointer select-none items-center gap-1.5 text-muted-foreground text-xs'>
              <Checkbox checked={showNonCredit} id='show-non-credit' onCheckedChange={(v) => setShowNonCredit(!!v)} />
              <label className='cursor-pointer' htmlFor='show-non-credit'>
                Phí khác
              </label>
            </div>
          </div>
        </div>
        {viewMode === "all" && (
          <div className='relative mt-2'>
            <Search className='absolute top-2 left-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              className='h-8 pl-8 text-xs'
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Tìm theo mã hoặc tên môn...'
              value={searchQuery}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className='max-h-[70vh] overflow-auto'>
        {viewMode === "grouped" ? (
          <div className='space-y-2'>
            {summary.map((entry, idx) => {
              const detail = details[entry.semesterName];
              if (!detail || detail.receiptGroups.length === 0) {
                return (
                  <div className='flex items-center gap-3 rounded-lg border p-4' key={entry.semesterName}>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground text-sm'>
                      {idx + 1}
                    </div>
                    <div className='flex-1'>
                      <p className='font-medium text-sm'>{entry.semesterName}</p>
                      <p className='text-muted-foreground text-xs'>Chưa có dữ liệu chi tiết</p>
                    </div>
                  </div>
                );
              }
              return (
                <SemesterCard
                  categoryFilter={categoryFilter}
                  detail={detail}
                  idx={idx}
                  key={entry.semesterName}
                  scholarship={scholarships[entry.semesterName] ?? null}
                  setScholarship={setScholarship}
                  showNonCredit={showNonCredit}
                />
              );
            })}
          </div>
        ) : (
          <AllItemsTable
            handleSort={handleSort}
            items={sortedItems}
            showNonCredit={showNonCredit}
            sortDir={sortDir}
            sortKey={sortKey}
          />
        )}
      </CardContent>
    </Card>
  );
}
