import { AwardType, CourseType, UserType } from "@/types";

type ScrapeResult<T> = { status: "success"; data: T; message: string } | { status: "error"; data: null; message: string };

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: table parsing is complex
const getUserData = (): ScrapeResult<{ userData: UserType; courseData: CourseType }> => {
  const _CANCEL_KEY = "__MPC_CANCEL__";
  const _CANCELLED_MSG = "Người dùng đã dừng nhập dữ liệu";

  if ((window as unknown as Record<string, unknown>)[_CANCEL_KEY]) {
    return { status: "error", data: null, message: _CANCELLED_MSG };
  }

  try {
    const appUserElement = document.querySelector("app-thongtin-user");
    if (!appUserElement) {
      return { status: "error", data: null, message: "Không tìm thấy thông tin người dùng. Hãy đảm bảo bạn đang ở trang thông tin cá nhân." };
    }

    const userInfoElement = appUserElement.querySelector(
      "app-thongtin-user > div:first-child > div.card-body"
    ) as HTMLElement | null;
    if (!userInfoElement) {
      return { status: "error", data: null, message: "Không tìm thấy bảng thông tin cá nhân" };
    }

    const courseInfoElement = appUserElement.querySelector(
      "app-thongtin-user > div:nth-child(2) > div > div > div.card-body"
    ) as HTMLElement | null;
    if (!courseInfoElement) {
      return { status: "error", data: null, message: "Không tìm thấy bảng thông tin khóa học" };
    }

    const userInfoValues: NodeListOf<HTMLElement> = userInfoElement.querySelectorAll(
      "div > .col > div .info-item > span:last-child"
    );

    const courseInfoValues: NodeListOf<HTMLElement> = courseInfoElement.querySelectorAll(
      ".row > div > div > div:last-child"
    );

    if (userInfoValues.length === 0) {
      return { status: "error", data: null, message: "Không thể đọc thông tin cá nhân" };
    }

    const avatarImg = document.querySelector("app-thongtin-user img, app-tinbaiviet-main img") as HTMLImageElement;
    const avatar = avatarImg?.src || "";

    const awards: AwardType[] = [];
    const cardHeaders = document.querySelectorAll(".card-header");
    for (const header of cardHeaders) {
      if ((header as HTMLElement).innerText.includes("Khen thưởng đạt được")) {
        const card = header.closest(".card");
        if (card) {
          const rows = card.querySelectorAll("tbody tr");
          for (const row of rows) {
            const cols = row.querySelectorAll("td");
            if (cols.length >= 4) {
              awards.push({
                decisionName: cols[0]?.innerText?.trim() || "",
                formOfReward: cols[1]?.innerText?.trim() || "",
                decisionDate: cols[2]?.innerText?.trim() || "",
                note: cols[3]?.innerText?.trim() || ""
              });
            }
          }
        }
        break;
      }
    }

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
      avatar,
      awards,
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

    return { status: "success", data: { userData, courseData }, message: "" };
  } catch (err) {
    return { status: "error", data: null, message: err instanceof Error ? err.message : "Lỗi khi đọc thông tin cá nhân" };
  }
};

export { getUserData };
