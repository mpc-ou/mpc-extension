export type UserType = {
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
  updatedAt: string;
};

export type CourseType = {
  classCode: string;
  major: string;
  faculty: string;
  degreeProgram: string;
  academicYear: string;
  updatedAt: string;
};

export type UserLabelMappingType = {
  [K in keyof UserType]: string;
};

export type CourseLabelMappingType = {
  [K in keyof CourseType]: string;
};
