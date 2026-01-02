// // https://developer.chrome.com/docs/extensions/mv3/messaging/

import { _DEFAULT_POINT_MAPPING } from "@/constants/default";
import { PointCharacterType, PointScale4Type } from "@/entrypoints/popup/PointTab/type";
import { _DEBOUNCE_TIME } from "../constants";

export function removeVietnameseTones(str: string) {
  return str
    .normalize("NFD") // Chuẩn hóa chuỗi theo dạng chuẩn Unicode
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ các dấu tổ hợp
    .replace(/đ/g, "d") // Thay thế chữ "đ"
    .replace(/Đ/g, "D") // Thay thế chữ "Đ"
    .replace(/[^\w\s]/gi, "") // Loại bỏ các ký tự đặc biệt
    .toLowerCase(); // Chuyển tất cả thành chữ thường
}

export function parseScale10ToCharacterAndScale4(scale10: number): {
  scale4: PointScale4Type;
  character: PointCharacterType;
} {
  const result = _DEFAULT_POINT_MAPPING.find((grade) => scale10 >= grade.minScale10);
  if (!result) {
    throw new Error("Lỗi khi convert điểm!");
  }
  return { scale4: result.scale4, character: result.character };
}
