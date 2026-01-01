declare const XLSX: any;
declare const Chart: any;

type RankTextType = "Xuất sắc" | "Giỏi" | "Khá" | "Trung Bình" | "Yếu" | "Kém";
type RankMappingType = {
  [K in RankTextType]: number;
};

type ParentItemCategory = "#dialog" | "#nav" | "#error" | "#container" | "#footer";
type ContainerItemCategory = "app" | "info" | "statistics";
type ChromeMessageTypeCategory = "CHECK_URL" | "GET_DATA_POINT" | "GET_DATA_USER_COURSE";
type ActionCategory = "create" | "update";
type UserLabelMappingType = {
  [K in keyof UserType]: string;
};
type CourseLabelMappingType = {
  [K in keyof CourseType]: string;
};

type UserType = {
  userId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  presenceStatus: string;
  phone: string;
  identityNumber: string;
  email: string;
  placeOfBirth: string;
  ethnicity: string;
  nationality: string;
  religion: string;
  residentialAddress: string;
  updatedAt: Date;
};

type CourseType = {
  classCode: string;
  major: string;
  faculty: string;
  degreeProgram: string;
  academicYear: string;
  updatedAt: Date;
};
