declare const XLSX: any;
declare const Chart: any;

type PointCharacterType = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D+" | "D" | "F" | "M";
type PointScale4Type = 4 | 3.5 | 3 | 2.5 | 2 | 1.5 | 1 | 0;

type PointMappingType = {
  minScale10: number;
  scale4: PointScale4Type;
  character: PointCharacterType;
};

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

type IgnoreListType = {
  data: string[];
  updatedAt: Date;
};

type ScoreRecordType = {
  code: string;
  name: string;
  credit: number;
  point: {
    scale10: number;
    scale4: number;
    character: PointCharacterType;
  };
  isIgnore?: boolean;
  // chỉ dùng isHead khi crawl
  isHead?: boolean;
};

type ScoreGroupType = {
  id: number;
  title: string;
  data: ScoreRecordType[];
  totalCredit: number;
  avgPoint: {
    scale10: number;
    scale4: number;
  };
};

type PointDataType = {
  data: ScoreGroupType[];
  isOnlyCalcGPA: boolean;
  queyText: string;
  updatedAt: Date;
};

// type Subject = {
//   code: string;
//   name: string;
//   credit: number;
//   finalPointRate: number;
// };

// type MajorType = {
//   name: string;
//   subjects: Subject[];
// };
