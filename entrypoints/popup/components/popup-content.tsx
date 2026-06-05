import {
  Banknote,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  InfoIcon,
  TriangleAlert,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SharedSectionProps = {
  isLoading: boolean;
  openDashboard: (tab?: string) => void;
};

function NoSiteSection({
  navTo,
  svHomepage,
  kcqHomepage
}: {
  navTo: (url: string) => void;
  svHomepage: string;
  kcqHomepage: string;
}) {
  return (
    <div className='flex flex-col items-center p-6 text-center'>
      <GraduationCap className='mb-4 h-12 w-12 text-primary' />
      <h3 className='mb-2 font-semibold text-lg'>Chưa truy cập hệ thống</h3>
      <p className='mb-6 text-muted-foreground text-sm'>
        Vui lòng truy cập trang Tiện ích sinh viên của trường để sử dụng chức năng đồng bộ dữ liệu.
      </p>
      <div className='w-full space-y-3'>
        <Button className='w-full font-medium' onClick={() => navTo(svHomepage)}>
          Sinh viên Chính quy
        </Button>
        <Button className='w-full font-medium' onClick={() => navTo(kcqHomepage)} variant='outline'>
          Sinh viên Đào tạo Từ xa
        </Button>
      </div>
    </div>
  );
}

function UserInfoSection({
  isLoading,
  openDashboard,
  handleImportInfo,
  hasInfo
}: SharedSectionProps & {
  handleImportInfo: () => Promise<void>;
  hasInfo: boolean;
}) {
  return (
    <div className='flex flex-col space-y-4 px-6 py-4'>
      <div className='mb-2 flex items-center gap-2'>
        <User className='h-5 w-5 text-primary' />
        <h3 className='font-semibold'>Thông tin cá nhân</h3>
      </div>

      <Button className='w-full' disabled={isLoading} onClick={handleImportInfo} variant='default'>
        {isLoading ? "Đang xử lý..." : "Nhập Thông tin cá nhân"}
      </Button>
      <Button
        className='w-full'
        disabled={!hasInfo}
        onClick={() => openDashboard("personal-info")}
        variant={hasInfo ? "outline" : "secondary"}
      >
        {hasInfo ? "Xem thông tin đã nhập" : "Chưa có thông tin"}
      </Button>
      <p className='text-muted-foreground text-xs'>
        * Vui lòng chờ trang tải đầy đủ thông tin trước khi nhập dữ liệu. Nếu có lỗi xảy ra, thử tải lại trang và nhập
        lại nhé.
      </p>
    </div>
  );
}

function ClassCalendarSection({
  isLoading,
  openDashboard,
  handleImportCalendar,
  hasStudyCalendar,
  hasExamCalendar
}: SharedSectionProps & {
  handleImportCalendar: (isExam: boolean) => Promise<void>;
  hasStudyCalendar: boolean;
  hasExamCalendar: boolean;
}) {
  return (
    <div className='flex flex-col space-y-4 px-6 py-4'>
      <div className='mb-2 flex items-center gap-2'>
        <BookOpen className='h-5 w-5 text-primary' />
        <h3 className='font-semibold'>Lịch học</h3>
      </div>
      <Button className='w-full' disabled={isLoading} onClick={() => handleImportCalendar(false)} variant='default'>
        {isLoading ? "Đang xử lý..." : "Nhập Lịch học"}
      </Button>
      <Button
        className='w-full'
        disabled={!(hasStudyCalendar || hasExamCalendar)}
        onClick={() => openDashboard("calendar")}
        variant={hasStudyCalendar || hasExamCalendar ? "outline" : "secondary"}
      >
        {hasStudyCalendar || hasExamCalendar ? "Xem lịch đã nhập" : "Chưa có lịch"}
      </Button>
      <p className='text-muted-foreground text-xs leading-relaxed'>
        Lịch học:{" "}
        {hasStudyCalendar ? (
          <span className='font-medium text-green-600 dark:text-green-400'>Đã có</span>
        ) : (
          <span className='font-medium text-amber-600 dark:text-amber-400'>Chưa có</span>
        )}
        {" · "}
        Lịch thi:{" "}
        {hasExamCalendar ? (
          <span className='font-medium text-green-600 dark:text-green-400'>Đã có</span>
        ) : (
          <span className='font-medium text-amber-600 dark:text-amber-400'>Chưa có</span>
        )}
      </p>
      <p className='text-muted-foreground text-xs'>
        * Vui lòng chờ trang tải đầy đủ thông tin trước khi nhập dữ liệu. Nếu có lỗi xảy ra, thử tải lại trang và nhập
        lại nhé.
      </p>
    </div>
  );
}

function ExamCalendarSection({
  isLoading,
  openDashboard,
  handleImportCalendar,
  hasStudyCalendar,
  hasExamCalendar
}: SharedSectionProps & {
  handleImportCalendar: (isExam: boolean) => Promise<void>;
  hasStudyCalendar: boolean;
  hasExamCalendar: boolean;
}) {
  return (
    <div className='flex flex-col space-y-4 px-6 py-4'>
      <div className='mb-2 flex items-center gap-2'>
        <CalendarClock className='h-5 w-5 text-primary' />
        <h3 className='font-semibold'>Lịch thi</h3>
      </div>
      <Button className='w-full' disabled={isLoading} onClick={() => handleImportCalendar(true)} variant='default'>
        {isLoading ? "Đang xử lý..." : "Nhập Lịch thi"}
      </Button>
      <Button
        className='w-full'
        disabled={!(hasStudyCalendar || hasExamCalendar)}
        onClick={() => openDashboard("calendar")}
        variant={hasStudyCalendar || hasExamCalendar ? "outline" : "secondary"}
      >
        {hasStudyCalendar || hasExamCalendar ? "Xem lịch đã nhập" : "Chưa có lịch"}
      </Button>
      <p className='text-muted-foreground text-xs leading-relaxed'>
        Lịch học:{" "}
        {hasStudyCalendar ? (
          <span className='font-medium text-green-600 dark:text-green-400'>Đã có</span>
        ) : (
          <span className='font-medium text-amber-600 dark:text-amber-400'>Chưa có</span>
        )}
        {" · "}
        Lịch thi:{" "}
        {hasExamCalendar ? (
          <span className='font-medium text-green-600 dark:text-green-400'>Đã có</span>
        ) : (
          <span className='font-medium text-amber-600 dark:text-amber-400'>Chưa có</span>
        )}
      </p>
      <p className='text-muted-foreground text-xs'>
        * Vui lòng chờ trang tải đầy đủ thông tin trước khi nhập dữ liệu. Nếu có lỗi xảy ra, thử tải lại trang và nhập
        lại nhé.
      </p>
    </div>
  );
}

function ScoreSection({
  isLoading,
  openDashboard,
  handleImportScore,
  hasScore
}: {
  isLoading: boolean;
  openDashboard: (tab?: string) => void;
  handleImportScore: () => Promise<void>;
  hasScore: boolean;
}) {
  return (
    <div className='flex flex-col space-y-4 px-6 py-4'>
      <div className='mb-2 flex items-center gap-2'>
        <CheckCircle2 className='h-5 w-5 text-primary' />
        <h3 className='font-semibold'>Kế hoạch điểm số</h3>
      </div>
      <Button className='w-full' disabled={isLoading} onClick={handleImportScore} variant='default'>
        {isLoading ? "Đang xử lý..." : "Nhập Điểm số"}
      </Button>
      <Button
        className='w-full'
        disabled={!hasScore}
        onClick={() => openDashboard("score-plan")}
        variant={hasScore ? "outline" : "secondary"}
      >
        {hasScore ? "Xem điểm đã nhập" : "Chưa có điểm"}
      </Button>
      <p className='text-muted-foreground text-xs'>
        * Vui lòng chờ trang tải đầy đủ thông tin trước khi nhập dữ liệu. Nếu có lỗi xảy ra, thử tải lại trang và nhập
        lại nhé.
      </p>
    </div>
  );
}

function TuitionSection({
  isLoading,
  openDashboard,
  handleImportTuition,
  hasTuition
}: {
  isLoading: boolean;
  openDashboard: (tab?: string) => void;
  handleImportTuition: () => Promise<void>;
  hasTuition: boolean;
}) {
  return (
    <div className='flex flex-col space-y-4 px-6 py-4'>
      <div className='mb-2 flex items-center gap-2'>
        <Banknote className='h-5 w-5 text-primary' />
        <h3 className='font-semibold'>Học phí</h3>
      </div>
      <Button className='w-full' disabled={isLoading} onClick={handleImportTuition} variant='default'>
        {isLoading ? "Đang xử lý..." : "Nhập Học phí"}
      </Button>
      <Button
        className='w-full'
        disabled={!hasTuition}
        onClick={() => openDashboard("tuition")}
        variant={hasTuition ? "outline" : "secondary"}
      >
        {hasTuition ? "Xem học phí đã nhập" : "Chưa có học phí"}
      </Button>

      <p className='text-muted-foreground text-xs'>
        * Vui lòng chờ trang tải đầy đủ thông tin trước khi nhập dữ liệu. Nếu có lỗi xảy ra, thử tải lại trang và nhập
        lại nhé.
      </p>
    </div>
  );
}

type PopupContentProps = {
  siteCurr: "sv" | "kcq" | null;
  currURL: string;
  isLoading: boolean;
  hasInfo: boolean;
  hasScore: boolean;
  hasStudyCalendar: boolean;
  hasExamCalendar: boolean;
  hasTuition: boolean;
  navTo: (url: string) => void;
  openDashboard: (tab?: string) => void;
  handleImportInfo: () => Promise<void>;
  handleImportScore: () => Promise<void>;
  handleImportCalendar: (isExam: boolean) => Promise<void>;
  handleImportTuition: () => Promise<void>;
  svHomepage: string;
  kcqHomepage: string;
};

export function PopupContent(props: PopupContentProps) {
  const {
    siteCurr,
    currURL,
    isLoading,
    hasInfo,
    hasScore,
    hasStudyCalendar,
    hasExamCalendar,
    hasTuition,
    navTo,
    openDashboard,
    handleImportInfo,
    handleImportScore,
    handleImportCalendar,
    handleImportTuition,
    svHomepage,
    kcqHomepage
  } = props;

  if (!siteCurr) {
    return <NoSiteSection kcqHomepage={kcqHomepage} navTo={navTo} svHomepage={svHomepage} />;
  }

  const warningBanner = isLoading ? (
    <div className='mx-6 mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-700 text-xs dark:text-amber-400'>
      <TriangleAlert className='h-4 w-4 shrink-0' />
      <span>Đang lấy dữ liệu, vui lòng không tắt popup để tránh mất dữ liệu.</span>
    </div>
  ) : null;

  if (currURL.includes("mode=userinfo")) {
    return (
      <>
        {warningBanner}
        <UserInfoSection
          handleImportInfo={handleImportInfo}
          hasInfo={hasInfo}
          isLoading={isLoading}
          openDashboard={openDashboard}
        />
      </>
    );
  }
  if (currURL.includes("#/tkb-hocky")) {
    return (
      <>
        {warningBanner}
        <ClassCalendarSection
          handleImportCalendar={handleImportCalendar}
          hasExamCalendar={hasExamCalendar}
          hasStudyCalendar={hasStudyCalendar}
          isLoading={isLoading}
          openDashboard={openDashboard}
        />
      </>
    );
  }
  if (currURL.includes("#/lichthi")) {
    return (
      <>
        {warningBanner}
        <ExamCalendarSection
          handleImportCalendar={handleImportCalendar}
          hasExamCalendar={hasExamCalendar}
          hasStudyCalendar={hasStudyCalendar}
          isLoading={isLoading}
          openDashboard={openDashboard}
        />
      </>
    );
  }
  if (currURL.includes("#/diem")) {
    return (
      <>
        {warningBanner}
        <ScoreSection
          handleImportScore={handleImportScore}
          hasScore={hasScore}
          isLoading={isLoading}
          openDashboard={openDashboard}
        />
      </>
    );
  }
  if (currURL.includes("#/hocphi")) {
    return (
      <>
        {warningBanner}
        <TuitionSection
          handleImportTuition={handleImportTuition}
          hasTuition={hasTuition}
          isLoading={isLoading}
          openDashboard={openDashboard}
        />
      </>
    );
  }
  return (
    <div className='flex flex-col items-center px-6 py-2 text-center'>
      <InfoIcon className='mb-4 h-10 w-10 text-muted-foreground' />
      <h3 className='mb-2 font-semibold text-lg'>Tính năng chưa khả dụng</h3>
      <p className='mb-4 text-muted-foreground text-sm'>
        Vui lòng chọn <strong>Thông tin cá nhân</strong>, <strong>Lịch học</strong>, <strong>Lịch thi</strong> hoặc{" "}
        <strong>Kế hoạch điểm số</strong> trên menu của trường để bắt đầu nhập dữ liệu.
      </p>
    </div>
  );
}
