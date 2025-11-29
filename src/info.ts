import {
  _ACTIVE_CLASS,
  _COURSE_KEY,
  _COURSE_LABEL_MAPPING,
  _FLAG_ERROR_KEY,
  _TIENICHSDH_URL,
  _TIENICHSV_URL,
  _USER_KEY,
  _USER_LABEL_MAPPING
} from "./constants";
import { _DEFAULT_COURSE_DATA, _DEFAULT_USER_DATA } from "./constants/default";
import { formatTime, getLocalData, injectScriptActiveTab, setLocalData } from "./utils";
import { getTabURL, GetURLMessageType, setError } from "./utils/globalDOM";
import { ContainerQS } from "./utils/query";

type GetDataPointMessageType = {
  type: ChromeMessageTypeCategory;
  payload: {
    userData: UserType | null;
    courseData: CourseType | null;
  };
};

const getData = async () => {
  try {
    const type: ChromeMessageTypeCategory = "GET_DATA_USER_COURSE";
    const appUserElement = document.querySelector("app-thongtin-user") as HTMLElement;

    if (!appUserElement) {
      const message: GetDataPointMessageType = {
        type: type,
        payload: { userData: null, courseData: null }
      };

      await chrome.runtime
        .sendMessage(message)
        .then(() => console.info("MPC Extension -> Not found (appUserElement) and send to the extension!"))
        .catch((err) => console.error(err));

      return;
    }

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
      updatedAt: new Date()
    };

    const courseData: CourseType = {
      classCode: courseInfoValues[0]?.innerText || "",
      major: courseInfoValues[1]?.innerText || "",
      faculty: courseInfoValues[2]?.innerText || "",
      degreeProgram: courseInfoValues[3]?.innerText || "",
      academicYear: courseInfoValues[4]?.innerText || "",
      updatedAt: new Date()
    };

    const message: GetDataPointMessageType = { type: type, payload: { userData, courseData } };

    await chrome.runtime
      .sendMessage(message)
      .then(() => console.info("MPC Extension -> Get data success and send to the extension!"))
      .catch((err) => console.error(err));
  } catch (error) {
    console.error(error);
  }
};

const Info = () => {
  const userData: UserType = getLocalData(_USER_KEY, _DEFAULT_USER_DATA);
  const courseData: CourseType = getLocalData(_COURSE_KEY, _DEFAULT_COURSE_DATA);

  const infoContainer = ContainerQS("#info") as HTMLElement;
  const noDataE = infoContainer.querySelector(".no-data") as HTMLElement;
  const mainDataE = infoContainer.querySelector(".main-data") as HTMLElement;
  const btnImportDataE = infoContainer.querySelector(".btn-import-data") as HTMLElement;
  const btnExportExcelE = infoContainer.querySelector(".btn-export-excel") as HTMLElement;
  const resultE = infoContainer.querySelector(".result") as HTMLElement;
  const userTableE = resultE.querySelector("table.user") as HTMLElement;
  const courseTableE = resultE.querySelector("table.course") as HTMLElement;

  let listener: (
    request: { type: ChromeMessageTypeCategory; payload: any },
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response: any) => void
  ) => void;

  const state = {
    user: userData,
    course: courseData
  };

  const subscribe = () => {
    listener = (request, _sender, _sendResponse) => {
      const { type, payload } = request;

      switch (type as ChromeMessageTypeCategory) {
        case "CHECK_URL": {
          const { URL }: GetURLMessageType["payload"] = payload;

          const _URL_TIENICHSV_INFO = _TIENICHSV_URL + "/#/home?mode=userinfo";
          const _URL_TIENICHSDH_INFO = _TIENICHSDH_URL + "/#/userinfo";
          const availableURL = [_URL_TIENICHSV_INFO, _URL_TIENICHSDH_INFO];

          if (!URL) {
            setError("Không thể lấy URL của trang hiện tại!");
            setLocalData(_FLAG_ERROR_KEY, true);
            return;
          }

          if (!availableURL.includes(URL)) {
            setLocalData(_FLAG_ERROR_KEY, true);
            setError(`Vui lòng truy cập vào trang <b class="error-nav-link">${_URL_TIENICHSV_INFO}</b> trước!`);
            noDataE.classList.add(_ACTIVE_CLASS);
            return;
          }

          mainDataE.classList.add(_ACTIVE_CLASS);
          btnImportDataE.classList.add(_ACTIVE_CLASS);
          return;
        }

        case "GET_DATA_USER_COURSE": {
          const hasError = getLocalData(_FLAG_ERROR_KEY, false);
          if (hasError) {
            setLocalData(_FLAG_ERROR_KEY, false);
            noDataE.classList.remove(_ACTIVE_CLASS);
            return;
          }

          const { userData, courseData }: GetDataPointMessageType["payload"] = payload;
          if (!userData || !courseData) {
            return;
          }

          updateData({ user: userData, course: courseData });
          saveDataToLocal();
          renderData();
          noDataE.classList.remove(_ACTIVE_CLASS);
          return;
        }
        default:
          console.error("No type match!");
          return;
      }
    };

    chrome.runtime.onMessage.addListener(listener);
  };

  const unsubscribe = () => {
    chrome.runtime.onMessage.removeListener(listener);
  };

  const firstCheck = () => {
    const hasPrevData = state.user.userId && state.course.classCode;
    if (hasPrevData) {
      noDataE.classList.remove(_ACTIVE_CLASS);
      mainDataE.classList.add(_ACTIVE_CLASS);
      btnImportDataE.classList.add(_ACTIVE_CLASS);
    } else {
      injectScriptActiveTab(getTabURL);
    }
  };

  const saveDataToLocal = () => {
    setLocalData(_USER_KEY, state.user);
    setLocalData(_COURSE_KEY, state.course);
  };

  const updateData = ({ user, course }: { user: UserType; course: CourseType }) => {
    state.user = user;
    state.course = course;
  };

  const renderData = () => {
    const userHtmls = Object.entries(state.user)
      .map(([key, value]) => {
        const labelKey = key as keyof typeof _USER_LABEL_MAPPING;
        const isDate = labelKey === "updatedAt";
        const userValue = isDate ? formatTime(value as Date) : value;

        return `
        <tr>
          <td>${_USER_LABEL_MAPPING[labelKey]}</td>
          <td>${userValue}</td>
        </tr>
      `;
      })
      .join("");

    const courseHtmls = Object.entries(state.course)
      .map(([key, value]) => {
        const labelKey = key as keyof typeof _COURSE_LABEL_MAPPING;
        const isDate = labelKey === "updatedAt";
        const courseValue = isDate ? formatTime(value as Date) : value;
        return `
        <tr>
          <td>${_COURSE_LABEL_MAPPING[labelKey]}</td>
          <td>${courseValue}</td>
        </tr>
      `;
      })
      .join("");

    userTableE.innerHTML = userHtmls;
    courseTableE.innerHTML = courseHtmls;
  };

  const eventHandlers = () => {
    btnImportDataE.onclick = () => {
      injectScriptActiveTab(getTabURL);
      injectScriptActiveTab(getData);
    };

    const createSheet = (data: any, mapping: UserLabelMappingType | CourseLabelMappingType) => {
      const worksheetData = [];
      worksheetData.push(["Trường", "Giá trị"]);

      Object.entries(mapping).forEach(([key, label]) => {
        let value = data[key];
        if (key === "updatedAt" && value) {
          value = new Date(value).toLocaleString("vi-VN");
        }
        worksheetData.push([label, value || "N/A"]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      worksheet["!cols"] = [{ width: 30 }, { width: 50 }];
      return worksheet;
    };

    btnExportExcelE.onclick = () => {
      const workbook = XLSX.utils.book_new();

      const userWorksheet = createSheet(state.user, _USER_LABEL_MAPPING);
      XLSX.utils.book_append_sheet(workbook, userWorksheet, "Thông tin cá nhân");

      const classWorksheet = createSheet(state.course, _COURSE_LABEL_MAPPING);
      XLSX.utils.book_append_sheet(workbook, classWorksheet, "Thông tin lớp học");

      XLSX.writeFile(workbook, "userInfo.xlsx");
    };
  };

  return {
    onMount() {
      subscribe();

      firstCheck();
      eventHandlers();
      renderData();
    },
    onUnmount() {
      unsubscribe();
    }
  };
};

export { Info };
