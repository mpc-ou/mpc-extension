import { HardDrive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SchoolParams({
  localRetakeRatio,
  setLocalRetakeRatio,
  localMaxCreditsPerSem,
  setLocalMaxCreditsPerSem,
  localMinCreditsPerSem,
  setLocalMinCreditsPerSem,
  localMaxCreditsWarn,
  setLocalMaxCreditsWarn,
  localMaxCreditsSum,
  setLocalMaxCreditsSum,
  localDrlThreshold,
  setLocalDrlThreshold
}: {
  localRetakeRatio: number;
  setLocalRetakeRatio: (v: number) => void;
  localMaxCreditsPerSem: number;
  setLocalMaxCreditsPerSem: (v: number) => void;
  localMinCreditsPerSem: number;
  setLocalMinCreditsPerSem: (v: number) => void;
  localMaxCreditsWarn: number;
  setLocalMaxCreditsWarn: (v: number) => void;
  localMaxCreditsSum: number;
  setLocalMaxCreditsSum: (v: number) => void;
  localDrlThreshold: number;
  setLocalDrlThreshold: (v: number) => void;
}) {
  return (
    <div className='rounded-lg border p-3'>
      <div className='mb-2 flex items-center gap-2'>
        <HardDrive className='h-4 w-4 text-muted-foreground' />
        <span className='font-medium text-sm'>Tham số trường</span>
      </div>
      <div className='grid grid-cols-2 gap-x-4 gap-y-3 text-xs'>
        <div className='space-y-1'>
          <Label className='text-muted-foreground'>Tỉ lệ học lại tối đa (%)</Label>
          <Input
            className='h-7 text-xs'
            min='0'
            onChange={(e) => setLocalRetakeRatio(Number(e.target.value) / 100 || 0)}
            step='1'
            type='number'
            value={(localRetakeRatio * 100).toFixed(0)}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-muted-foreground'>TC tối đa/kỳ chính</Label>
          <Input
            className='h-7 text-xs'
            min='1'
            onChange={(e) => setLocalMaxCreditsPerSem(Number(e.target.value) || 25)}
            type='number'
            value={localMaxCreditsPerSem}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-muted-foreground'>TC tối thiểu/kỳ chính</Label>
          <Input
            className='h-7 text-xs'
            min='0'
            onChange={(e) => setLocalMinCreditsPerSem(Number(e.target.value) || 14)}
            type='number'
            value={localMinCreditsPerSem}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-muted-foreground'>TC tối đa (cảnh báo)</Label>
          <Input
            className='h-7 text-xs'
            min='1'
            onChange={(e) => setLocalMaxCreditsWarn(Number(e.target.value) || 14)}
            type='number'
            value={localMaxCreditsWarn}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-muted-foreground'>TC tối đa/kỳ hè</Label>
          <Input
            className='h-7 text-xs'
            min='1'
            onChange={(e) => setLocalMaxCreditsSum(Number(e.target.value) || 12)}
            type='number'
            value={localMaxCreditsSum}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-muted-foreground'>Ngưỡng ĐRL cảnh báo</Label>
          <Input
            className='h-7 text-xs'
            min='0'
            onChange={(e) => setLocalDrlThreshold(Number(e.target.value) || 50)}
            type='number'
            value={localDrlThreshold}
          />
        </div>
      </div>
    </div>
  );
}
