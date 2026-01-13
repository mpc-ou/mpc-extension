import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { ScoreGroupType } from "./type";

const updateIgnoreSubject = (data: ScoreGroupType[], ignoreList: string[]) => {
  const newData = data.map((d) => {
    d.data = d.data.map((item) => {
      const isIgnore = ignoreList.some((i) => item.code.includes(i));
      item.isIgnore = isIgnore;
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

const updateScoreAvg = (data: ScoreGroupType[]) => {
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
      scale10: Number.parseFloat(String(avg.point.scale10 / avg.credit)) || null,
      scale4: Number.parseFloat(String(avg.point.scale4 / avg.credit)) || null
    };

    return d;
  });

  return newData;
};

const getScoreSummary = (data: ScoreGroupType[]) => {
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
    totalSubject: data.reduce((acc, curr) => acc + curr.data.length, 0),
    gpa10: sumCredit > 0 ? +(sumScale10 / sumCredit) : 0,
    gpa4: sumCredit > 0 ? +(sumScale4 / sumCredit) : 0
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
