import {
  CourseLabelMappingType,
  CourseType,
  UserLabelMappingType,
  UserType
} from "@/entrypoints/sidepanel/InfoTab/type";

const _CHROME_STORAGE_TYPE: _CHROME_STORAGE_CATE = "local";
const _CHROME_STORAGE_NAME = "infoData" as const;
export const _CHROME_STORAGE_INFO_KEY = `${_CHROME_STORAGE_TYPE}:${_CHROME_STORAGE_NAME}` as const;

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
