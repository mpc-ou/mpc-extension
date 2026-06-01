import { useState } from "react";
import { toast } from "sonner";
import {
  _GET_CLASS_CALENDAR_DATA,
  _GET_EXAM_CALENDAR_DATA,
  _GET_POINT_DATA,
  _GET_TUITION_DATA,
  _GET_USER_DATA
} from "@/constants/chrome";
import { useConfirm } from "@/hooks/use-confirm";
import { useCalendarStore } from "@/store/use-calendar-store";
import { useCurrentUserStore } from "@/store/use-current-user-store";
import { useGlobalStore } from "@/store/use-global-store";
import { useInfoStore } from "@/store/use-info-store";
import { useScoreStore } from "@/store/use-score-store";
import { useTuitionStore } from "@/store/use-tuition-store";
import type { SemesterTuitionDetail, TuitionSummaryEntry } from "@/types";
import { updateIgnoreSubject, updateScoreAvg } from "@/utils/score";
import { getLatestAvgCreditCost } from "@/utils/tuition-compute";

const LATEST_AVG_CREDIT_KEY = "latestAvgCreditCost";
const SCRAPE_TIMEOUT_MS = 65_000;

/** Gửi message với timeout 5s — nếu quá hạn, throw lỗi mạng. */
async function sendWithTimeout<T>(type: string): Promise<T> {
  const result = await Promise.race([
    browser.runtime.sendMessage({ type }) as Promise<T>,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Mạng của bạn không ổn định, vui lòng thử lại")), SCRAPE_TIMEOUT_MS)
    )
  ]);
  return result;
}

export function useImportActions() {
  const [isLoading, setIsLoading] = useState(false);
  const confirm = useConfirm();
  const studentId = useCurrentUserStore((s) => s.effectiveStudentId);

  const { userData } = useInfoStore();
  const { originalScores } = useScoreStore();
  const {
    studyCalendarData,
    examCalendarData,
    setStudyCalendarData,
    setExamCalendarData,
    saveData: saveCalendarData
  } = useCalendarStore();
  const { summary } = useTuitionStore();
  const ignoreList = useGlobalStore((s) => s.ignoreList);

  const hasInfo = userData.userId !== "";
  const hasScore = originalScores.length > 0;
  const hasStudyCalendar = studyCalendarData.length > 0;
  const hasExamCalendar = examCalendarData.length > 0;
  const hasTuition = summary.length > 0;

  const handleImportInfo = async () => {
    if (hasInfo) {
      const isConfirmed = await confirm({
        title: "Xác nhận ghi đè",
        description: "Bạn đã nhập thông tin. Bạn có chắc chắn muốn ghi đè dữ liệu cũ?",
        confirmText: "Ghi đè",
        variant: "destructive"
      });
      if (!isConfirmed) {
        return;
      }
    }

    setIsLoading(true);
    toast.info("Đang lấy thông tin...");
    try {
      // biome-ignore lint/suspicious/noExplicitAny: API response is a dynamic message payload
      const data = await sendWithTimeout<any>(_GET_USER_DATA);
      if (data?.status === "success") {
        useInfoStore.getState().setUserData(data.data.userData);
        useInfoStore.getState().setCourseData(data.data.courseData);
        await useInfoStore.getState().saveData(studentId);
        toast.success("Lấy thông tin thành công!");
      } else {
        toast.error(data?.message || "Không thể lấy dữ liệu");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi lấy thông tin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportScore = async () => {
    if (hasScore) {
      const isConfirmed = await confirm({
        title: "Xác nhận ghi đè",
        description: "Bạn đã nhập điểm. Bạn có chắc chắn muốn ghi đè dữ liệu cũ?",
        confirmText: "Ghi đè",
        variant: "destructive"
      });
      if (!isConfirmed) {
        return;
      }
    }

    setIsLoading(true);
    toast.info("Đang lấy điểm...");
    try {
      const data = await browser.runtime.sendMessage({ type: _GET_POINT_DATA });
      if (data?.status === "success") {
        const updated = updateIgnoreSubject(data.data, ignoreList);
        const withAvg = updateScoreAvg(updated);
        useScoreStore.getState().setOriginalScores(withAvg);
        useScoreStore.getState().setScores(withAvg);
        useScoreStore.getState().setLastUpdate(new Date());
        await useScoreStore.getState().saveData(studentId);
        toast.success("Lấy điểm thành công!");
      } else {
        toast.error(data?.message || "Không thể lấy dữ liệu");
      }
    } catch (e) {
      toast.error("Lỗi khi lấy điểm");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmCalendarOverwrite = async (isExam: boolean) => {
    if (isExam ? !hasExamCalendar : !hasStudyCalendar) {
      return true;
    }
    const confirmMsg = isExam
      ? "Bạn đã nhập lịch thi. Lịch thi mới sẽ ghi đè lên lịch thi cũ. Tiếp tục?"
      : "Bạn đã nhập lịch học. Lịch học mới sẽ ghi đè lên lịch học cũ. Tiếp tục?";
    return await confirm({
      title: "Xác nhận ghi đè",
      description: confirmMsg,
      confirmText: "Ghi đè",
      variant: "destructive"
    });
  };

  const handleImportCalendar = async (isExam: boolean) => {
    const isConfirmed = await confirmCalendarOverwrite(isExam);
    if (!isConfirmed) {
      return;
    }

    setIsLoading(true);
    toast.info("Đang lấy lịch...");
    try {
      const type = isExam ? _GET_EXAM_CALENDAR_DATA : _GET_CLASS_CALENDAR_DATA;
      // biome-ignore lint/suspicious/noExplicitAny: API response is a dynamic message payload
      const data = await sendWithTimeout<any>(type);

      if (!data || data.status !== "success") {
        toast.error(data?.message || "Không thể lấy dữ liệu");
        return;
      }
      if (isExam) {
        setExamCalendarData(data.data);
      } else {
        setStudyCalendarData(data.data);
      }
      await saveCalendarData(studentId);
      toast.success(`Lấy lịch thành công ${data.data.length || 0} học kỳ!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi lấy lịch");
    } finally {
      setIsLoading(false);
    }
  };

  const saveTuitionData = async (data: {
    summary: TuitionSummaryEntry[];
    details?: Record<string, SemesterTuitionDetail>;
  }) => {
    useTuitionStore.getState().setData(data.summary, data.details || {}, studentId);

    const latestAvg = getLatestAvgCreditCost(data.summary, data.details || {});
    if (latestAvg !== null) {
      const sid = useCurrentUserStore.getState().effectiveStudentId;
      if (sid) {
        await storage.setItem(`local:${sid}:${LATEST_AVG_CREDIT_KEY}`, latestAvg);
      }
    }
  };

  const handleImportTuition = async () => {
    if (hasTuition) {
      const isConfirmed = await confirm({
        title: "Xác nhận ghi đè",
        description: "Bạn đã nhập học phí. Bạn có chắc chắn muốn ghi đè dữ liệu cũ?",
        confirmText: "Ghi đè",
        variant: "destructive"
      });
      if (!isConfirmed) {
        return;
      }
    }

    setIsLoading(true);
    toast.info("Đang lấy học phí...");
    try {
      // biome-ignore lint/suspicious/noExplicitAny: API response is a dynamic message payload
      const data = await sendWithTimeout<any>(_GET_TUITION_DATA);
      if (data?.status === "success") {
        await saveTuitionData(data.data);
        toast.success("Lấy học phí thành công!");
      } else {
        toast.error(data?.message || "Không thể lấy dữ liệu");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi lấy học phí");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    hasInfo,
    hasScore,
    hasStudyCalendar,
    hasExamCalendar,
    hasTuition,
    handleImportInfo,
    handleImportScore,
    handleImportCalendar,
    handleImportTuition
  };
}
