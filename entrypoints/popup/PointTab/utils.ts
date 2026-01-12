import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { _DEFAULT_FIXED_POINT, _DEFAULT_IGNORE_SUBJECT_DATA } from "@/constants/default";
import { ScoreGroupType } from "./type";

// 1. ADDED: ignoreList argument (defaults to old constant)
const updateIgnoreSubject = (
  data: ScoreGroupType[], 
  ignoreList: string[] = _DEFAULT_IGNORE_SUBJECT_DATA
) => {
  const newData = data.map((d) => {
    d.data = d.data.map((item) => {
      // 2. CHANGED: Use the passed ignoreList
      const isIgnore = ignoreList.find((i) => item.code.includes(i));
      if (isIgnore) {
        item.isIgnore = true;
      }
      return item;
    });
    return d;
  });

  for (const d of newData) {
    d.data.sort((a, b) => {
      if (a.isIgnore) {
        return 1;
      }
      if (b.isIgnore) {
        return -1;
      }
      return 0;
    });
  }

  return newData;
};

// 3. ADDED: fixedPoint argument (defaults to old constant)
const updateScoreAvg = (
  data: ScoreGroupType[], 
  fixedPoint: number = _DEFAULT_FIXED_POINT
) => {
  const newData = data.map((d) => {
    const totalCredit = d.data.reduce((acc, curr) => {
      const isIgnoreCredit = curr.isIgnore || !curr.point.character || curr.point.character === "F";
      if (isIgnoreCredit) {
        return acc;
      }
      return acc + curr.credit;
    }, 0);

    const avg = d.data.reduce(
      (acc, curr) => {
        const point = curr.point;
        const credit = curr.credit;

        const isValidPoint =
          typeof credit === "number" &&
          typeof point.scale10 === "number" &&
          typeof point.scale4 === "number" &&
          !Number.isNaN(point.scale10) &&
          !Number.isNaN(point.scale4);

        if (!isValidPoint || curr.isIgnore) {
          return acc;
        }

        return {
          point: {
            scale10: acc.point.scale10 + point.scale10 * credit,
            scale4: acc.point.scale4 + point.scale4 * credit
          },
          credit: acc.credit + credit
        };
      },
      {
        point: {
          scale10: 0,
          scale4: 0
        },
        credit: 0
      }
    );

    d.totalCredit = totalCredit;
    d.avgPoint = {
      // 4. CHANGED: Use fixedPoint variable
      scale10: Number.parseFloat((avg.point.scale10 / avg.credit).toFixed(fixedPoint)) || null,
      scale4: Number.parseFloat((avg.point.scale4 / avg.credit).toFixed(fixedPoint)) || null
    };

    return d;
  });

  return newData;
};

// 5. ADDED: fixedPoint argument
const getScoreSummary = (
  data: ScoreGroupType[], 
  fixedPoint: number = _DEFAULT_FIXED_POINT
) => {
  const totalCredit = data.reduce((acc, curr) => acc + curr.totalCredit, 0);

  let sumScale10 = 0;
  let sumScale4 = 0;
  let sumCredit = 0;

  for (const item of data) {
    for (const curr of item.data) {
      const { credit, point } = curr;

      if (
        curr.isIgnore ||
        typeof credit !== "number" ||
        typeof point.scale10 !== "number" ||
        typeof point.scale4 !== "number" ||
        Number.isNaN(credit) ||
        Number.isNaN(point.scale10) ||
        Number.isNaN(point.scale4)
      ) {
        continue;
      }

      sumScale10 += point.scale10 * credit;
      sumScale4 += point.scale4 * credit;
      sumCredit += credit;
    }
  }

  return {
    semesterCount: data.length,
    totalCredit,
    // 6. CHANGED: Use fixedPoint variable
    gpa10: sumCredit > 0 ? +(sumScale10 / sumCredit).toFixed(fixedPoint) : 0,
    gpa4: sumCredit > 0 ? +(sumScale4 / sumCredit).toFixed(fixedPoint) : 0
  };
};

const handleExportData = (data: ScoreGroupType[]) => {
  const worksheetData: (string | number)[][] = [];

  // Header
  worksheetData.push([
    "STT",
    "Học kỳ",
    "Mã môn học",
    "Tên môn học",
    "Số tín chỉ",
    "Điểm hệ 10",
    "Điểm hệ 4",
    "Xếp loại",
    "Ghi chú (Không tính GPA)"
  ]);

  let stt = 1;

  for (const semester of data) {
    for (const subject of semester.data) {
      worksheetData.push([
        stt,
        semester.title,
        subject.code,
        subject.name,
        subject.credit,
        subject.point.scale10 ?? "N/A",
        subject.point.scale4 ?? "N/A",
        subject.point.character ?? "N/A",
        subject.isIgnore ? "Không tính" : ""
      ]);
      stt += 1;
    }
  }

  const workbook = XLSXUtils.book_new();
  const worksheet = XLSXUtils.aoa_to_sheet(worksheetData);

  worksheet["!cols"] = [
    { width: 5 },
    { width: 30 },
    { width: 15 },
    { width: 50 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 20 }
  ];

  XLSXUtils.book_append_sheet(workbook, worksheet, "Bảng điểm");
  XLSXWriteFile(workbook, `bang_diem_mpc_${new Date().toISOString()}.xlsx`);
};

export { updateIgnoreSubject, updateScoreAvg, getScoreSummary, handleExportData };