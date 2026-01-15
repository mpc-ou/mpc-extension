import { PointMappingType } from "@/entrypoints/popup/PointTab/type";

export const _DEFAULT_IGNORE_SEMESTER_TITLE: string = "Bảo lưu";
export const _DEFAULT_FIXED_POINT: number = 3;

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

export const _DEFAULT_IGNORE_SUBJECT_DATA: string[] = [
  "_", // BHYT, Đồng phục thể dục
  "MEETING", // Sinh hoạt lớp
  "PEDU", // Giáo dục thể chất
  "DEDU", // Giáo dục quốc phòng
  "TEST", // Kiểm tra đầu vào
  "GENG0", // Tiếng Anh căn bản
  "GENG4" // Tiếng Anh đầu ra
];

export const _DEFAULT_SITE_URL_MAPPING: _SITE_MAPPING = {
  sv: {
    label: "Tiện ích SV",
    homepage: "https://tienichsv.ou.edu.vn",
    point: "https://tienichsv.ou.edu.vn/public/#/diem",
    classCalendar: "https://tienichsv.ou.edu.vn/public/#/tkb-tuan",
    examCalendar: "https://tienichsv.ou.edu.vn/public/#/lichthi",
    info: "https://tienichsv.ou.edu.vn/public/#/home?mode=userinfo"
  },
  kcq: {
    label: "Tiện ích KCQ",
    homepage: "https://tienichkcq.oude.edu.vn/",
    point: "https://tienichkcq.oude.edu.vn/#/diem",
    classCalendar: "https://tienichkcq.oude.edu.vn/#/tkb-tuan",
    examCalendar: "https://tienichkcq.oude.edu.vn/#/lichthi",
    info: "https://tienichkcq.oude.edu.vn/#/home?mode=userinfo"
  }
};

// export const _DEFAULT_RANK_MAPPING: RankMappingType = {
//   "Xuất sắc": 3.6,
//   Giỏi: 3.2,
//   Khá: 2.5,
//   "Trung Bình": 2.0,
//   Yếu: 1.0,
//   Kém: 0
// };
