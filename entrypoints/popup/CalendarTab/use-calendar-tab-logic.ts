import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { _GET_CLASS_CALENDAR_DATA } from "@/constants/chrome";
import { _DEFAULT_SITE_URL_MAPPING } from "@/constants/default";
import { useGlobalStore } from "@/store/use-global-store";
import { SemesterData } from "./type";
import { useCalendarStore } from "./use-calendar-store";
import { convertToExcel } from "./utils/excel-utils";
import { downloadICS } from "./utils/ics-utils";

type ProgressState = {
  isProgress: boolean;
  message: string;
};

export function getNavigateButtonState(siteCurr: string, siteCurrURL: string) {
  const mapping = _DEFAULT_SITE_URL_MAPPING[siteCurr as keyof typeof _DEFAULT_SITE_URL_MAPPING];
  if (!mapping) {
    return null;
  }

  if (siteCurrURL === mapping.classCalendar) {
    return {
      title: "Đi đến Lịch Thi",
      importButton: "Nhập lại lịch học",
      url: mapping.examCalendar,
      isCalendarPage: true
    };
  }
  if (siteCurrURL === mapping.examCalendar) {
    return {
      title: "Đi đến Lịch Học",
      importButton: "Nhập lại lịch thi",
      url: mapping.classCalendar,
      isCalendarPage: true
    };
  }
  return null;
}

export function useCalendarTabLogic() {
  const siteCurr = useGlobalStore((s) => s.siteCurr);
  const siteCurrURL = useGlobalStore((s) => s.siteCurrURL);
  const { calendarData, getData, saveData, clearData } = useCalendarStore();
  const [isLoading, setIsLoading] = useState(false);
  const setCalendarData = useCalendarStore((state) => state.setCalendarData);

  const navigateButton = useMemo(() => getNavigateButtonState(siteCurr, siteCurrURL), [siteCurr, siteCurrURL]);

  const [progressState, setProgressState] = useState<ProgressState>({
    isProgress: false,
    message: ""
  });

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    type: "import" | "delete" | null;
  }>({
    open: false,
    type: null
  });

  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const mapping = _DEFAULT_SITE_URL_MAPPING[siteCurr as keyof typeof _DEFAULT_SITE_URL_MAPPING];
  const isOnCalendarPage = mapping && (siteCurrURL === mapping.classCalendar || siteCurrURL === mapping.examCalendar);

  useEffect(() => {
    getData();
  }, [getData]);

  const getCalendars = async () => {
    if (!isOnCalendarPage) {
      toast.error("Vui lòng truy cập trang Lịch Học hoặc Lịch Thi để nhập dữ liệu!");
      return;
    }

    if (siteCurrURL === _DEFAULT_SITE_URL_MAPPING[siteCurr].examCalendar) {
      toast.error("Chức năng nhập Lịch Thi hiện chưa được hỗ trợ.");
      return;
    }

    setIsLoading(true);
    setProgressState({
      isProgress: true,
      message: "Bắt đầu nhập dữ liệu TKB..."
    });
    toast.info("Bắt đầu nhập dữ liệu TKB...");

    try {
      const data = await browser.runtime.sendMessage({
        type: _GET_CLASS_CALENDAR_DATA
      });

      setCalendarData(data);
      setProgressState({ isProgress: false, message: "Hoàn thành!" });

      if (data && !data.error) {
        await saveData();
        toast.success(`Đã nhập và lưu thành công ${data?.length || 0} học kỳ!`);
      } else {
        toast.error("Lỗi khi nhập dữ liệu!");
      }
    } catch (error) {
      console.error("[MPC Extension] Lỗi khi nhập dữ liệu:", error);
      toast.error(`Lỗi khi nhập dữ liệu: ${(error as Error).message}`);
      setProgressState({ isProgress: false, message: "Lỗi!" });
    } finally {
      setIsLoading(false);
      setConfirmState({ open: false, type: null });
    }
  };

  const clearStorage = async () => {
    try {
      await clearData();
      toast.success("Đã xóa dữ liệu!");
    } catch (error) {
      toast.error("Không thể xóa dữ liệu");
    } finally {
      setConfirmState({ open: false, type: null });
    }
  };

  const downloadJSON = () => {
    if (!calendarData) {
      toast.warning("Không có dữ liệu để tải xuống!");
      return;
    }

    const dataStr = JSON.stringify(calendarData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TKB_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Đã tải xuống file JSON!");
  };

  const downloadExcel = () => {
    if (!calendarData) {
      toast.warning("Không có dữ liệu để xuất!");
      return;
    }

    try {
      convertToExcel(calendarData);
      toast.success(`Đã xuất ${calendarData.length} học kỳ sang file Excel!`);
    } catch (error) {
      console.error("[MPC Extension] Lỗi khi xuất file Excel:", error);
      toast.error("Lỗi khi xuất file Excel");
    }
  };

  const handleExportCalendar = (selectedSemesters: SemesterData[]) => {
    try {
      downloadICS(selectedSemesters);
      toast.success(
        `Đã xuất ${selectedSemesters.length} học kỳ sang file .ics! Import vào Google Calendar để sử dụng.`
      );
    } catch (error) {
      console.error("[MPC Extension] Lỗi khi xuất file .ics:", error);
      toast.error("Lỗi khi xuất file .ics");
    }
  };

  const handleConfirm = () => {
    if (confirmState.type === "import") {
      getCalendars();
    } else if (confirmState.type === "delete") {
      clearStorage();
    }
  };

  return {
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
  };
}
