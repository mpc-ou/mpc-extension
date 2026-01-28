import { CourseType, UserType } from "@/entrypoints/sidepanel/InfoTab/type";

const getUserData = () => {
  const appUserElement = document.querySelector("app-thongtin-user") as HTMLElement;

  const userInfoElement = appUserElement.querySelector(
    "app-thongtin-user > div:first-child > div.card-body"
  ) as HTMLElement;
  const courseInfoElement = appUserElement.querySelector(
    "app-thongtin-user > div:nth-child(2) > div > div > div.card-body"
  ) as HTMLElement;

  const userInfoValues: NodeListOf<HTMLElement> = userInfoElement.querySelectorAll(
    "div > .col > div .info-item > span:last-child"
  );

  const courseInfoValues: NodeListOf<HTMLElement> = courseInfoElement.querySelectorAll(
    ".row > div > div > div:last-child"
  );

  const userData: UserType = {
    userId: userInfoValues[0]?.innerText || "",
    fullName: userInfoValues[1]?.innerText || "",
    dateOfBirth: userInfoValues[2]?.innerText || "",
    gender: userInfoValues[3]?.innerText || "",
    presenceStatus: userInfoValues[4]?.innerText || "",
    phone: userInfoValues[5]?.innerText || "",
    identityNumber: userInfoValues[6]?.innerText || "",
    ethnicity: userInfoValues[7]?.innerText || "",
    religion: userInfoValues[8]?.innerText || "",
    placeOfBirth: userInfoValues[9]?.innerText || "",
    nationality: userInfoValues[10]?.innerText || "",
    email: userInfoValues[11]?.innerText || "",
    residentialAddress: userInfoValues[13]?.innerText || "",
    updatedAt: new Date().toISOString()
  };

  const courseData: CourseType = {
    classCode: courseInfoValues[0]?.innerText || "",
    major: courseInfoValues[1]?.innerText || "",
    faculty: courseInfoValues[2]?.innerText || "",
    degreeProgram: courseInfoValues[3]?.innerText || "",
    academicYear: courseInfoValues[4]?.innerText || "",
    updatedAt: new Date().toISOString()
  };

  return { userData, courseData };
};

export { getUserData };
