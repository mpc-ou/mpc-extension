import { BookOpenIcon, InfoIcon } from "lucide-react";
import keHoachDiemSoMd from "@/assets/docs/ke_hoach_diem_so.md?raw";
import { MarkdownModal } from "@/components/custom/markdown-modal";
import { Button } from "@/components/ui/button";
import type { ScoreGroupType } from "@/types";
import { ImportScoreModal } from "./import-score-modal";

export function ScoreEmptyState({
  guideOpen,
  importModalOpen,
  onGuideOpenChange,
  onImportOpenChange,
  onImportSuccess,
  onOpenImportManual
}: {
  guideOpen: boolean;
  importModalOpen: boolean;
  onGuideOpenChange: (open: boolean) => void;
  onImportOpenChange: (open: boolean) => void;
  onImportSuccess: (data: ScoreGroupType[]) => Promise<void>;
  onOpenImportManual: () => void;
}) {
  return (
    <>
      <div className='flex min-h-[60vh] flex-col items-center justify-center space-y-4'>
        <div className='mb-4 rounded-full bg-muted p-6'>
          <BookOpenIcon className='h-12 w-12 text-muted-foreground' />
        </div>
        <h2 className='font-semibold text-2xl'>Chưa có dữ liệu điểm số</h2>
        <p className='mb-6 max-w-md text-center text-muted-foreground'>
          Hệ thống chưa tìm thấy dữ liệu điểm của bạn. Vui lòng truy cập trang web Xem điểm của trường và mở tiện ích
          (popup) để đồng bộ dữ liệu nhé!
        </p>
        <Button className='w-full max-w-sm' onClick={onOpenImportManual} variant='outline'>
          Tải bảng điểm thủ công
        </Button>
        <Button onClick={() => onGuideOpenChange(true)} variant='outline'>
          <InfoIcon className='mr-2 h-4 w-4' />
          Hướng dẫn đồng bộ điểm
        </Button>
      </div>
      <MarkdownModal
        isOpen={guideOpen}
        markdownContent={keHoachDiemSoMd}
        onClose={() => onGuideOpenChange(false)}
        title='Hướng dẫn Kế hoạch điểm số'
      />
      <ImportScoreModal onImportSuccess={onImportSuccess} onOpenChange={onImportOpenChange} open={importModalOpen} />
    </>
  );
}
