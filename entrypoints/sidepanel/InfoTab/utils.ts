import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { CourseType, UserType } from "@/entrypoints/sidepanel/InfoTab/type";

type MappingType = Record<string, string>;

const createSheet = (data: UserType | CourseType, mapping: MappingType) => {
  const worksheetData: (string | number)[][] = [];

  worksheetData.push(["Trường", "Giá trị"]);

  for (const [key, label] of Object.entries(mapping)) {
    const typedKey = key as keyof (UserType | CourseType);
    let value: string;
    const rawValue = data?.[typedKey];

    if (typedKey === "updatedAt" && rawValue) {
      value = new Date(rawValue).toLocaleString("vi-VN");
    } else {
      value = rawValue ? String(rawValue) : "N/A";
    }

    worksheetData.push([label, value]);
  }

  const worksheet = XLSXUtils.aoa_to_sheet(worksheetData);
  worksheet["!cols"] = [{ width: 30 }, { width: 50 }];

  return worksheet;
};

const handleExportData = (
  userData: UserType,
  courseData: CourseType,
  userMapping: MappingType,
  courseMapping: MappingType
) => {
  const workbook = XLSXUtils.book_new();
  const userWorksheet = createSheet(userData, userMapping);
  const courseWorksheet = createSheet(courseData, courseMapping);

  XLSXUtils.book_append_sheet(workbook, userWorksheet, "Thông tin người dùng");
  XLSXUtils.book_append_sheet(workbook, courseWorksheet, "Thông tin khóa học");

  XLSXWriteFile(workbook, `thong_tin_mpc_${new Date().toISOString()}.xlsx`);
};

export { handleExportData };
