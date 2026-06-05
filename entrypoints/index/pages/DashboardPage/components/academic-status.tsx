import { TrendingUpIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AcademicRankType } from "@/types";

export function AcademicStatus({ rank, gpa4 }: { rank: AcademicRankType; gpa4: number }) {
  return (
    <Card className={cn("gap-2 border py-4", rank.bg)}>
      <CardContent className='flex items-center gap-4 py-4'>
        <span className='text-4xl'>{rank.emoji}</span>
        <div>
          <p className='text-muted-foreground text-sm'>Học lực hiện tại</p>
          <p className={cn("font-bold text-2xl", rank.color)}>{rank.label}</p>
        </div>
        <div className='ml-auto flex items-center gap-2 text-muted-foreground text-sm'>
          <TrendingUpIcon className='h-4 w-4' />
          GPA {gpa4.toFixed(2)} / 4.0
        </div>
      </CardContent>
    </Card>
  );
}
