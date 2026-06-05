import { format } from "date-fns";
import {
  CalculatorIcon,
  ClipboardCopyIcon,
  DownloadIcon,
  FileOutputIcon,
  ImportIcon,
  MonitorIcon,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function ScoreToolbar({
  lastUpdate,
  onCalcGuide,
  onClearData,
  onCopyData,
  onExportData,
  onImportAuto,
  onImportManual
}: {
  lastUpdate: Date | null;
  onCalcGuide: () => void;
  onClearData: () => void;
  onCopyData: () => void;
  onExportData: () => void;
  onImportAuto: () => void;
  onImportManual: () => void;
}) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      {lastUpdate && (
        <span className='mr-auto text-muted-foreground text-xs'>
          Cập nhật: {format(lastUpdate, "dd/MM/yyyy HH:mm")}
        </span>
      )}

      <Button className='text-muted-foreground' onClick={onCalcGuide} size='sm' variant='ghost'>
        <CalculatorIcon className='mr-2 h-4 w-4' />
        Cách tính điểm
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size='sm'>
            <ImportIcon className='mr-2 h-4 w-4' />
            Nhập điểm
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onImportAuto}>
            <MonitorIcon className='mr-2 h-4 w-4 text-blue-500' />
            Nhập tự động
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onImportManual}>
            <DownloadIcon className='mr-2 h-4 w-4 text-green-500' />
            Nhập thủ công
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size='sm' variant='outline'>
            <FileOutputIcon className='mr-2 h-4 w-4' />
            Thao tác
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onExportData}>
            <FileOutputIcon className='mr-2 h-4 w-4 text-green-500' />
            Xuất điểm (Excel)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onCopyData}>
            <ClipboardCopyIcon className='mr-2 h-4 w-4 text-blue-500' />
            Sao chép dữ liệu
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onClearData}>
            <Trash2 className='mr-2 h-4 w-4 text-red-500' />
            Xóa dữ liệu
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
