import { FilterIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type GroupMode = "semester" | "all";

export function ScoreFiltersBar({
  selectedGrades,
  groupMode,
  hideNonGPA,
  onAddSemester,
  onFilterOpen,
  onGroupModeChange,
  onSearchTextChange,
  onToggleHideNonGPA,
  searchText
}: {
  selectedGrades: Set<string>;
  groupMode: GroupMode;
  hideNonGPA: boolean;
  onAddSemester: () => void;
  onFilterOpen: () => void;
  onGroupModeChange: (mode: GroupMode) => void;
  onSearchTextChange: (value: string) => void;
  onToggleHideNonGPA: (v: boolean) => void;
  searchText: string;
}) {
  const ALL_GRADES_COUNT = 9;
  const isFilterActive = selectedGrades.size < ALL_GRADES_COUNT;

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <div className='relative min-w-50 flex-1'>
        <SearchIcon className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
        <Input
          className='pl-9'
          onChange={(e) => onSearchTextChange(e.target.value)}
          placeholder='Tìm kiếm môn học...'
          value={searchText}
        />
      </div>
      <Tabs onValueChange={(v) => onGroupModeChange(v as GroupMode)} value={groupMode}>
        <TabsList className='h-9'>
          <TabsTrigger className='text-xs' value='semester'>
            Theo kỳ
          </TabsTrigger>
          <TabsTrigger className='text-xs' value='all'>
            Tất cả
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Button onClick={onFilterOpen} size='sm' variant='outline'>
        <FilterIcon className='mr-2 h-4 w-4' />
        Lọc
        {isFilterActive && (
          <span className='ml-1 rounded-full bg-primary px-1.5 text-primary-foreground text-xs'>
            {selectedGrades.size}/{ALL_GRADES_COUNT} loại
          </span>
        )}
      </Button>

      <Button onClick={onAddSemester} size='sm' variant='outline'>
        <PlusIcon className='mr-2 h-4 w-4' />
        Thêm kỳ mới
      </Button>

      <div className='flex cursor-pointer items-center gap-1.5 text-muted-foreground text-sm'>
        <Checkbox checked={hideNonGPA} id='hide-non-gpa' onCheckedChange={(v) => onToggleHideNonGPA(!!v)} />
        <label className='cursor-pointer' htmlFor='hide-non-gpa'>
          Ẩn môn không tính GPA
        </label>
      </div>
    </div>
  );
}
