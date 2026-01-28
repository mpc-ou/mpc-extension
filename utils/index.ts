// // https://developer.chrome.com/docs/extensions/mv3/messaging/

import { _GET_CURRENT_URL, _NAVIGATE_TO_URL, _OPEN_NEW_TAB } from "@/constants/chrome";
import { _DEFAULT_POINT_MAPPING } from "@/constants/default";
import { PointCharacterType, PointScale4Type } from "@/entrypoints/sidepanel/PointTab/type";

export const removeVietnameseTones = (str: string) => {
  return str
    .normalize("NFD") // Chuẩn hóa chuỗi theo dạng chuẩn Unicode
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ các dấu tổ hợp
    .replace(/đ/g, "d") // Thay thế chữ "đ"
    .replace(/Đ/g, "D") // Thay thế chữ "Đ"
    .replace(/[^\w\s]/gi, "") // Loại bỏ các ký tự đặc biệt
    .toLowerCase(); // Chuyển tất cả thành chữ thường
};

export const parseScale10ToCharacterAndScale4 = (
  scale10: number
): {
  scale4: PointScale4Type;
  character: PointCharacterType;
} => {
  const result = _DEFAULT_POINT_MAPPING.find((grade) => scale10 >= grade.minScale10);
  if (!result) {
    throw new Error("Lỗi khi convert điểm!");
  }
  return { scale4: result.scale4, character: result.character };
};

export const getCurrTabURL = async (): Promise<string> => {
  const URL = await browser.runtime.sendMessage({ type: _GET_CURRENT_URL });
  return URL;
};

export const openNewTab = async (url: string): Promise<void> => {
  await browser.runtime.sendMessage({ type: _OPEN_NEW_TAB, url });
};

export const navigateToURL = async (url: string): Promise<void> => {
  await browser.runtime.sendMessage({ type: _NAVIGATE_TO_URL, url });
};
