import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { _OUCOMMUNITY_PROGRAM_URL } from "@/constants/default";

export function PersonalSettings({
  totalProgramCredits,
  setTotalProgramCredits,
  trainingSemesters,
  setTrainingSemesters
}: {
  totalProgramCredits: number;
  setTotalProgramCredits: (v: number) => void;
  trainingSemesters: number;
  setTrainingSemesters: (v: number) => void;
}) {
  return (
    <div className='grid grid-cols-2 gap-4'>
      <div className='space-y-1.5'>
        <Label className='font-medium'>Tổng tín chỉ CTĐT</Label>
        <p className='text-[10px] text-muted-foreground'>
          Tổng tín chỉ toàn khóa ngành bạn. Không đúng?{" "}
          <a
            className='font-medium text-amber-600'
            href={_OUCOMMUNITY_PROGRAM_URL}
            rel='noopener noreferrer'
            target='_blank'
          >
            Tra cứu ở đây
          </a>
        </p>
        <Input
          className='h-8 text-sm'
          onChange={(e) => setTotalProgramCredits(Number(e.target.value) || 0)}
          type='number'
          value={totalProgramCredits}
        />
      </div>
      <div className='space-y-1.5'>
        <Label className='font-medium'>Số học kỳ tính DRL trung bình</Label>
        <p className='text-[10px] text-muted-foreground'>Số học kỳ đầu dùng để tính trung bình điểm rèn luyện</p>
        <Input
          className='h-8 text-sm'
          onChange={(e) => setTrainingSemesters(Number(e.target.value) || 10)}
          type='number'
          value={trainingSemesters}
        />
      </div>
    </div>
  );
}
