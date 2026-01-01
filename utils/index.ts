// // https://developer.chrome.com/docs/extensions/mv3/messaging/

// import { _DEBOUNCE_TIME } from "../constants";
// import { _DEFAULT_POINT_MAPPING } from "../constants/default";

// export const injectScriptActiveTab = (injectScript: () => void) => {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     const tab = tabs[0];

//     chrome.scripting
//       .executeScript({
//         target: { tabId: tab.id as number },
//         func: injectScript
//       })
//       .then(() => console.info("Injected JS to the active tab!"))
//       .catch((err) => console.error(err));
//   });
// };

// export function debounce(func: (...args: any[]) => void, timeout = _DEBOUNCE_TIME) {
//   let timer: number;
//   return function (this: any, ...args: any[]) {
//     clearTimeout(timer);
//     timer = setTimeout(() => {
//       func.apply(this, args);
//     }, timeout);
//   };
// }

export function removeVietnameseTones(str: string) {
  return str
    .normalize("NFD") // Chuẩn hóa chuỗi theo dạng chuẩn Unicode
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ các dấu tổ hợp
    .replace(/đ/g, "d") // Thay thế chữ "đ"
    .replace(/Đ/g, "D") // Thay thế chữ "Đ"
    .replace(/[^\w\s]/gi, "") // Loại bỏ các ký tự đặc biệt
    .toLowerCase(); // Chuyển tất cả thành chữ thường
}

export function formatTime(time: Date) {
  const options: Intl.DateTimeFormatOptions = {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  };

  const date = new Date(time);
  return date.toLocaleString("vi-VN", options);
}

// export function parseScale10ToCharacterAndScale4(scale10: number): {
//   scale4: PointScale4Type;
//   character: PointCharacterType;
// } {
//   const result = _DEFAULT_POINT_MAPPING.find((grade) => scale10 >= grade.minScale10)!;
//   return { scale4: result.scale4, character: result.character };
// }

// localStorage
// export function getLocalData(key: string, defaultValue: any = {}) {
//   const item = localStorage.getItem(key);
//   return item ? JSON.parse(item) : defaultValue;
// }

// export function getLocalDataField(key: string, field: string) {
//   return getLocalData(key)[field];
// }

// export function setLocalData(key: string, data: any) {
//   localStorage.setItem(key, JSON.stringify(data));
// }

// export function setLocalDataField(key: string, field: string, value: any) {
//   const data = getLocalData(key);
//   data[field] = value;
//   setLocalData(key, data);
// }

// export function removeLocalData(key: string) {
//   localStorage.removeItem(key);
// }
