import type {
  AcademicRankType,
  CourseLabelMappingType,
  CourseType,
  PointMappingType,
  ScoreFilterType,
  ScoreSummaryType,
  TrainingRankType,
  UserLabelMappingType,
  UserSettingsType,
  UserType
} from "@/types";
import { buildPageRegex } from "@/utils";

export const _DEFAULT_IGNORE_SEMESTER_TITLE: string = "Bảo lưu";
export const _DEFAULT_FIXED_POINT: number = 3;

export const _DEFAULT_POINT_MAPPING: PointMappingType[] = [
  { minScale10: 9.0, character: "A+", scale4: 4 },
  { minScale10: 8.5, character: "A", scale4: 4 },
  { minScale10: 8.0, character: "B+", scale4: 3.5 },
  { minScale10: 7.0, character: "B", scale4: 3.0 },
  { minScale10: 6.5, character: "C+", scale4: 2.5 },
  { minScale10: 5.5, character: "C", scale4: 2.0 },
  { minScale10: 5.0, character: "D+", scale4: 1.5 },
  { minScale10: 4.0, character: "D", scale4: 1.0 },
  { minScale10: 0.0, character: "F", scale4: 0.0 }
];

export const _DEFAULT_IGNORE_SUBJECT_DATA: string[] = [
  "_", // BHYT, Đồng phục thể dục
  "MEETING", // Sinh hoạt lớp
  "PEDU", // Giáo dục thể chất
  "DEDU", // Giáo dục quốc phòng
  "TEST", // Kiểm tra đầu vào
  "GENG0", // Tiếng Anh căn bản
  "GENG4", // Tiếng Anh đầu ra
  "_BHYT12T",
  "_BHYT6T"
];

function _createSiteConfig(
  label: string,
  homepageUrl: string,
  baseRegexPrefix: string,
  pages: Record<string, { tailUrl: string; label: string }>
): _SITE_CONFIG {
  const config: _SITE_CONFIG = {
    label,
    homepage: { url: homepageUrl, regex: `${baseRegexPrefix}.*$` },
    baseRegexPrefix,
    pages: {} as Record<_PAGE_CATE, _PAGE_CONFIG>
  };
  for (const [key, page] of Object.entries(pages)) {
    config.pages[key as _PAGE_CATE] = {
      tailUrl: page.tailUrl,
      regex: buildPageRegex(baseRegexPrefix, page.tailUrl),
      label: page.label
    };
  }
  return config;
}

export const _DEFAULT_SITE_URL_MAPPING: _SITE_MAPPING = {
  sv: _createSiteConfig(
    "Tiện ích SV (Dành cho SV chính quy)",
    "https://tienichsv.ou.edu.vn",
    "^https:\\/\\/tienichsv\\.ou\\.edu\\.vn(?:\\/[^#]*)?",
    {
      point: { tailUrl: "#/diem", label: "Bảng điểm" },
      classCalendar: { tailUrl: "#/tkb-hocky", label: "Lịch học" },
      examCalendar: { tailUrl: "#/lichthi", label: "Lịch thi" },
      tuition: { tailUrl: "#/hocphi", label: "Học phí" },
      info: { tailUrl: "#/home?mode=userinfo", label: "Thông tin cá nhân" }
    }
  ),
  kcq: _createSiteConfig(
    "Tiện ích KCQ",
    "https://tienichkcq.oude.edu.vn/",
    "^https:\\/\\/tienichkcq\\.oude\\.edu\\.vn(?:\\/[^#]*)?",
    {
      point: { tailUrl: "#/diem", label: "Bảng điểm" },
      classCalendar: { tailUrl: "#/tkb-hocky", label: "Lịch học" },
      examCalendar: { tailUrl: "#/lichthi", label: "Lịch thi" },
      tuition: { tailUrl: "#/hocphi", label: "Học phí" },
      info: { tailUrl: "#/home?mode=userinfo", label: "Thông tin cá nhân" }
    }
  )
};

export const _DEFAULT_GRADE_COLORS: Record<string, string> = {
  "A+": "#22c55e",
  A: "#4ade80",
  "B+": "#86efac",
  B: "#60a5fa",
  "C+": "#93c5fd",
  C: "#fbbf24",
  "D+": "#fb923c",
  D: "#f87171",
  F: "#ef4444"
};

/** Course codes classified as dịch vụ (BHYT, etc.) rather than học phí học tập. */
export const _TUITION_SERVICE_CODES = ["_BHYTTN1", "_BHYT12T", "_BHYT6T", "_BHYT12"];

/** Tooltip mô tả cho từng xếp loại khi hover trên bảng điểm. */
export const _GRADE_TOOLTIP: Record<string, string> = {
  "A+": "Điểm hệ 10 từ 9.0 – 10.0",
  A: "Điểm hệ 10 từ 8.5 – 9.0",
  "B+": "Điểm hệ 10 từ 8.0 – 8.5",
  B: "Điểm hệ 10 từ 7.0 – 8.0",
  "C+": "Điểm hệ 10 từ 6.5 – 7.0",
  C: "Điểm hệ 10 từ 5.5 – 6.5",
  "D+": "Điểm hệ 10 từ 5.0 – 5.5",
  D: "Điểm hệ 10 từ 4.0 – 5.0",
  F: "Điểm hệ 10 dưới 4.0",
  M: "Môn này bạn được miễn học, không tính vào GPA",
  Đ: "Bạn đạt điểm Đạt của môn này, không tính trong GPA"
};

/** Mã môn bị loại khỏi tính đơn giá trung bình chuyên ngành (GENG, DEDU, PEDU). */
export const _TUITION_MAJOR_EXCLUDE_PREFIXES = ["GENG", "DEDU", "PEDU"] as const;

export const _TUITION_CATEGORIES = ["tất cả", "học phí", "dịch vụ"] as const;

export const _DEFAULT_ACADEMIC_RANKS: { minGpa4: number; rank: AcademicRankType }[] = [
  {
    minGpa4: 3.6,
    rank: {
      label: "Xuất sắc",
      emoji: "🏆",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
    }
  },
  {
    minGpa4: 3.2,
    rank: {
      label: "Giỏi",
      emoji: "⭐",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
    }
  },
  {
    minGpa4: 2.5,
    rank: {
      label: "Khá",
      emoji: "👍",
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
    }
  },
  {
    minGpa4: 2.0,
    rank: {
      label: "Trung bình",
      emoji: "📚",
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
    }
  },
  {
    minGpa4: 1.0,
    rank: {
      label: "Yếu",
      emoji: "⚠️",
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
    }
  },
  {
    minGpa4: 0,
    rank: {
      label: "Kém",
      emoji: "❌",
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
    }
  }
];

/** Regex pattern to parse semester titles like "Học kỳ 1 - Năm học 2024 - 2025" */
export const _SEMESTER_TITLE_REGEX = /Học kỳ\s+(.*?)\s+-\s+Năm học\s+(\d{4})\s*-\s*(\d{4})/i;

/** Regex pattern to extract short semester format like "HK1 24-25" */
export const _SEMESTER_SHORT_REGEX = /Học kỳ\s+(.*?)\s+-\s+Năm học\s+\d{2}(\d{2})\s*-\s*\d{2}(\d{2})/i;

/** Max number of terms per academic year before rolling over */
export const _MAX_SEMESTER_TERMS = 3;

/** Excel export column widths */
export const _EXPORT_COL_WIDTHS = [5, 30, 15, 50, 10, 10, 10, 10, 20];

/** Excel export sheet name */
export const _EXPORT_SHEET_NAME = "Bảng điểm";

export const _DEFAULT_USER_SETTINGS: UserSettingsType = {
  trainingSemesters: 10,
  totalProgramCredits: 130
};

/** School-wide: max retake credit ratio before degree downgrade */
export const _DEFAULT_RETAKE_RATIO_LIMIT = 0.05;

/** School-wide: credit limits per semester */
export const _DEFAULT_MAX_CREDITS_PER_SEMESTER = 25;
export const _DEFAULT_MIN_CREDITS_PER_SEMESTER = 14;
export const _DEFAULT_MAX_CREDITS_WARNING = 14;
export const _DEFAULT_MAX_CREDITS_SUMMER = 12;

/** Default user settings for new users */
export const _EXPORT_FILE_PREFIX = "bang_diem_mpc";

/** Max credits required for graduation (used for score prediction) */
export const _DEFAULT_MAX_CREDITS = 135;

/** Excellent GPA threshold (used for advisor mascot) */
export const _DEFAULT_EXCELLENT_GPA_THRESHOLD = 3.6;

export const _DEFAULT_TRAINING_RANKS: TrainingRankType[] = [
  { minPoint: 90, label: "Xuất sắc", emoji: "💎", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { minPoint: 80, label: "Tốt", emoji: "🌟", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { minPoint: 65, label: "Khá", emoji: "✨", color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
  {
    minPoint: 50,
    label: "Trung bình",
    emoji: "📚",
    color: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-950/30"
  },
  { minPoint: 35, label: "Yếu", emoji: "⚠️", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
  { minPoint: 0, label: "Kém", emoji: "❌", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" }
];

/** Threshold for DRL (Điểm rèn luyện) below which triggers a warning (2 consecutive semesters). */
export const _DEFAULT_DRL_WARNING_THRESHOLD = 50;

/** Threshold for minimum training point required for scholarship */
export const _DEFAULT_MIN_TRAINING_POINT_SCHOLARSHIP = 65;

/** OUCommunity program reference URL — used in Settings & Onboarding */
export const _OUCOMMUNITY_PROGRAM_URL = "https://www.oucommunity.dev/tuyen-sinh/gioi-thieu-nganh/";

export const _DEFAULT_USER_DATA: UserType = {
  userId: "",
  fullName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  identityNumber: "",
  email: "",
  placeOfBirth: "",
  ethnicity: "",
  religion: "",
  presenceStatus: "",
  residentialAddress: "",
  nationality: "",
  avatar: "",
  awards: [],
  updatedAt: new Date().toISOString()
};

export const _DEFAULT_COURSE_DATA: CourseType = {
  classCode: "",
  major: "",
  faculty: "",
  degreeProgram: "",
  academicYear: "",
  updatedAt: new Date().toISOString()
};

export const _USER_LABEL_MAPPING: UserLabelMappingType = {
  userId: "Mã SV",
  fullName: "Họ và tên",
  dateOfBirth: "Ngày sinh",
  gender: "Giới tính",
  presenceStatus: "Trạng thái",
  phone: "Điện thoại",
  identityNumber: "Số CMND/CCCD",
  ethnicity: "Dân tộc",
  religion: "Tôn giáo",
  placeOfBirth: "Nơi sinh",
  nationality: "Quốc tịch",
  email: "Email",
  residentialAddress: "Địa chỉ",
  avatar: "Ảnh đại diện",
  awards: "Khen thưởng",
  updatedAt: "Cập nhật"
};

export const _COURSE_LABEL_MAPPING: CourseLabelMappingType = {
  classCode: "Mã lớp",
  major: "Ngành",
  faculty: "Khoa",
  degreeProgram: "Chương trình đào tạo",
  academicYear: "Niên khóa",
  updatedAt: "Cập nhật"
};

export const _DEFAULT_SCORE_SUMMARY: ScoreSummaryType = {
  semesterCount: 0,
  totalCredit: 0,
  gpa10: 0,
  gpa4: 0,
  avgTrainingPoint: 0
};

export const _DEFAULT_SCORE_FILTER: ScoreFilterType = {
  queryText: "",
  isOnlyCalcGPA: false
};

export const _DEFAULT_FORM_DATA = {
  code: "",
  name: "",
  credit: "",
  scale10: ""
};
