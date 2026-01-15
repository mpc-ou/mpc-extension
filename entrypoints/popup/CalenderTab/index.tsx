import {
  Calendar1Icon,
  CalendarPlusIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  ImportIcon,
  Trash2Icon
} from "lucide-react";
import { ButtonNavSite } from "@/components/custom/button-nav-site";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { useGlobalStore } from "@/store/use-global-store";
import { CalendarView } from "./calendar-view";
import { ExportCalendarDialog } from "./export-calendar-dialog";
import type { SemesterData, WeekData } from "./type";

function getConfirmMessage(type: "import" | "delete" | null, hasData: boolean) {
  if (type === "import") {
    return hasData
      ? "Bạn đang có dữ liệu TKB. Nhập dữ liệu mới sẽ ghi đè lên dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục?"
      : "Bạn có chắc chắn muốn nhập dữ liệu TKB? Quá trình này có thể mất vài phút.";
  }
  return "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu TKB? Hành động này không thể hoàn tác.";
}

import { useCalendarTabLogic } from "./use-calendar-tab-logic";

const CalendarEmptyState = ({
  navigateButton,
  isLoading,
  isOnCalendarPage,
  onImport
}: {
  navigateButton: { title: string; url: string } | null;
  isLoading: boolean;
  isOnCalendarPage: boolean;
  onImport: () => void;
}) => (
  <Empty className='h-full bg-linear-to-b from-30% from-muted/50 to-background'>
    <EmptyHeader>
      <EmptyMedia>
        <ImportIcon className='h-12 w-12 text-muted-foreground' />
      </EmptyMedia>
      <EmptyTitle>Chưa có dữ liệu lịch nào!</EmptyTitle>
      <EmptyDescription>Vui lòng truy cập trang lịch trên Tiện ích để nhập dữ liệu lịch.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <div className='flex gap-2'>
        <ButtonNavSite
          disabled={!navigateButton || isLoading}
          size='sm'
          title={navigateButton?.title || ""}
          url={navigateButton?.url || ""}
        >
          <Calendar1Icon className='mr-2 h-4 w-4' />
          {navigateButton ? navigateButton.title : "Đi đến trang Lịch"}
        </ButtonNavSite>
        <Button disabled={isLoading} hidden={!isOnCalendarPage} onClick={onImport} size='sm'>
          <ImportIcon className='mr-2 h-4 w-4' />
          Nhập dữ liệu
        </Button>
      </div>
    </EmptyContent>
  </Empty>
);

const CalendarDataView = ({
  calendarData,
  isLoading,
  navigateButton,
  onImportClick,
  onExportClick,
  onDownloadExcel,
  onDownloadJSON,
  onDeleteClick
}: {
  calendarData: SemesterData[];
  isLoading: boolean;
  navigateButton: { importButton: string } | null;
  onImportClick: () => void;
  onExportClick: () => void;
  onDownloadExcel: () => void;
  onDownloadJSON: () => void;
  onDeleteClick: () => void;
}) => (
  <>
    <div className='flex justify-between gap-2'>
      <div className='flex items-center space-x-2'>
        <h2 className='font-semibold text-lg'>Thời Khóa Biểu</h2>
      </div>
      <div className='flex items-center space-x-2'>
        <Button disabled={isLoading} onClick={onImportClick} size='sm'>
          <ImportIcon className='mr-2 h-4 w-4' />
          {navigateButton ? navigateButton.importButton : "Nhập dữ liệu"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size='sm' variant='outline'>
              Thao tác
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem disabled={isLoading} onClick={onExportClick}>
              <CalendarPlusIcon className='mr-2 h-4 w-4' />
              Xuất Google Calendar
            </DropdownMenuItem>
            <DropdownMenuItem disabled={isLoading} onClick={onDownloadExcel}>
              <FileSpreadsheetIcon className='mr-2 h-4 w-4' />
              Xuất Excel
            </DropdownMenuItem>
            <DropdownMenuItem disabled={isLoading} onClick={onDownloadJSON}>
              <DownloadIcon className='mr-2 h-4 w-4' />
              Tải JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={isLoading} onClick={onDeleteClick} variant='destructive'>
              <Trash2Icon className='mr-2 h-4 w-4' />
              Xóa dữ liệu
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div className='flex flex-col space-y-4'>
      <div className='space-y-4'>
        <div>
          Đang có <b>{calendarData.length}</b> học kỳ, với tổng cộng{" "}
          <b>
            {calendarData
              .reduce(
                (acc: number, semester: SemesterData) =>
                  acc + semester.weeks.reduce((weekAcc: number, week: WeekData) => weekAcc + week.schedule.length, 0),
                0
              )
              .toLocaleString()}
          </b>{" "}
          sự kiện.
        </div>
        <CalendarView data={calendarData} />
      </div>
    </div>
  </>
);

export function CalenderTab() {
  const {
    navigateButton,
    isLoading,
    calendarData,
    confirmState,
    setConfirmState,
    exportDialogOpen,
    setExportDialogOpen,
    isOnCalendarPage,
    getCalendars,
    handleConfirm,
    handleExportCalendar,
    downloadExcel,
    downloadJSON
  } = useCalendarTabLogic();

  const siteCurr = useGlobalStore((s) => s.siteCurr);

  return (
    <section className='position-relative space-y-2 px-4 py-2'>
      <Alert className='border-none p-0'>
        <AlertDescription>
          <div className='mx-auto flex items-center justify-center text-center'>
            Dữ liệu cần được lấy từ:{" "}
            <ButtonNavSite url={_DEFAULT_SITE_URL_MAPPING[siteCurr].classCalendar} variant='link'>
              Lịch Học
            </ButtonNavSite>
            hoặc
            <ButtonNavSite url={_DEFAULT_SITE_URL_MAPPING[siteCurr].examCalendar} variant='link'>
              Lịch Thi
            </ButtonNavSite>
            {navigateButton?.isCalendarPage ? (
              <CircleCheckIcon className='ml-2 h-5 w-5 text-green-500' />
            ) : (
              <CircleAlertIcon className='ml-2 h-5 w-5 text-red-500' />
            )}
          </div>
        </AlertDescription>
      </Alert>
      {!calendarData && (
        <CalendarEmptyState
          isLoading={isLoading}
          isOnCalendarPage={isOnCalendarPage}
          navigateButton={navigateButton}
          onImport={getCalendars}
        />
      )}
      {!!calendarData && (
        <CalendarDataView
          calendarData={calendarData}
          isLoading={isLoading}
          navigateButton={navigateButton}
          onDeleteClick={() => setConfirmState({ open: true, type: "delete" })}
          onDownloadExcel={downloadExcel}
          onDownloadJSON={downloadJSON}
          onExportClick={() => setExportDialogOpen(true)}
          onImportClick={() => setConfirmState({ open: true, type: "import" })}
        />
      )}

      {calendarData ? (
        <ExportCalendarDialog
          calendarData={calendarData}
          onExport={handleExportCalendar}
          onOpenChange={setExportDialogOpen}
          open={exportDialogOpen}
        />
      ) : null}

      <AlertDialog onOpenChange={(open) => setConfirmState({ ...confirmState, open })} open={confirmState.open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmState.type === "import" ? "Xác nhận nhập dữ liệu" : "Xác nhận xóa dữ liệu"}
            </AlertDialogTitle>
            <AlertDialogDescription>{getConfirmMessage(confirmState.type, !!calendarData)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {confirmState.type === "import" ? "Xác nhận" : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
