export const _DEBOUNCE_TIME: number = 1000;
export const _ERROR_MESSAGE_TIMEOUT: number = 5000;

export const _ACTION_CREATE = "create" as const;
export const _ACTION_UPDATE = "update" as const;

export const _ACTIVE_CLASS = "active";

export const _TIENICHSV_URL = "https://tienichsv.ou.edu.vn" as const;
export const _TIENICHSDH_URL = "https://tienichsdh.ou.edu.vn" as const;
export const _FB_HOMEPAGE_URL: string = "https://www.facebook.com/CLBLapTrinhTrenThietBiDiDong" as const;
export const _GITHUB_URL: string = "https://github.com/mpc-ou/mpc-extension" as const;

export const _POINT_KEY = "point" as const;
export const _USER_KEY = "user" as const;
export const _COURSE_KEY = "course" as const;
export const _IGNORE_LIST_KEY = "ignoreList" as const;
export const _FLAG_ERROR_KEY = "flagError" as const;
export const _CURR_TAB_KEY = "currTab" as const;

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
