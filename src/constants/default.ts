export const _DEFAULT_IGNORE_SEMESTER_TITLE: string = "Bảo lưu";
export const _DEFAULT_FIXED_POINT: number = 3;
export const _DEFAULT_COMPONENT: ContainerItemCategory = "app";

export const _DEFAULT_FLAG_ERROR: boolean = false;

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

export const _DEFAULT_RANK_MAPPING: RankMappingType = {
  "Xuất sắc": 3.6,
  Giỏi: 3.2,
  Khá: 2.5,
  "Trung Bình": 2.0,
  Yếu: 1.0,
  Kém: 0
};

export const _DEFAULT_IGNORE_SUBJECT_DATA: string[] = [
  "_", // BHYT, Đồng phục thể dục
  "MEETING", // Sinh hoạt lớp
  "PEDU", // Giáo dục thể chất
  "DEDU", // Giáo dục quốc phòng
  "TEST", // Kiểm tra đầu vào
  "GENG0", // Tiếng Anh căn bản
  "GENG4" // Tiếng Anh đầu ra
];

export const _DEFAULT_POINT_DATA: PointDataType = {
  data: [],
  isOnlyCalcGPA: false,
  queyText: "",
  updatedAt: new Date()
};

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
  updatedAt: new Date()
};

export const _DEFAULT_COURSE_DATA: CourseType = {
  classCode: "",
  major: "",
  faculty: "",
  degreeProgram: "",
  academicYear: "",
  updatedAt: new Date()
};
