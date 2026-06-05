import type { PointCharacterType, ScoreGroupType } from "@/types";

type ScrapeResult<T> = { status: "success"; data: T; message: string } | { status: "error"; data: null; message: string };

const getPointData = (): ScrapeResult<ScoreGroupType[]> => {
  const _CANCEL_KEY = "__MPC_CANCEL__";
  const _CANCELLED_MSG = "Người dùng đã dừng nhập dữ liệu";

  if ((window as unknown as Record<string, unknown>)[_CANCEL_KEY]) {
    return { status: "error", data: null, message: _CANCELLED_MSG };
  }

  try {
    function parseOverviewRow(r: Element, group: ScoreGroupType): void {
      const titleField = (r.querySelector("td:first-child") as HTMLElement)?.innerText.trim();
      const valueField = (r.querySelector("td:last-child") as HTMLElement)?.innerText.trim();
      if (!(titleField && valueField)) {
        return;
      }

      if (titleField.includes("Điểm rèn luyện học kỳ")) {
        group.trainingPoint = Number.parseInt(valueField, 10) || null;
      } else if (titleField.includes("Điểm trung bình học kỳ hệ 4")) {
        group.avgPoint.scale4 = Number.parseFloat(valueField) || 0;
      } else if (titleField.includes("Điểm trung bình học kỳ hệ 10")) {
        group.avgPoint.scale10 = Number.parseFloat(valueField) || 0;
      } else if (titleField.includes("Số tín chỉ đạt học kỳ")) {
        group.totalCredit = Number.parseInt(valueField, 10) || 0;
      }
    }

    function parseDataRow(columns: NodeListOf<HTMLElement>, data: ScoreGroupType[]): void {
      const character = columns[11].innerText as PointCharacterType;
      const scale10Raw = columns[9].innerText.trim();
      const scale4Raw = columns[10].innerText.trim();
      const code = columns[1].innerText;
      if (code.startsWith("_")) {
        return;
      }
      data.at(-1)?.data.push({
        code,
        name: columns[3].innerText,
        credit: Number.parseFloat(columns[4].innerText) || 0,
        point: {
          scale10: scale10Raw ? Number.parseFloat(scale10Raw) : 0,
          scale4: scale4Raw ? Number.parseFloat(scale4Raw) : 0,
          character
        }
      });
    }

    const tableRows = document.querySelectorAll("table#excel-table > tbody > tr");
    if (tableRows.length === 0) {
      return { status: "error", data: null, message: "Không tìm thấy bảng điểm. Hãy đảm bảo bạn đang ở trang xem điểm." };
    }

    const data: ScoreGroupType[] = [];

    for (const [index, row] of Array.from(tableRows).entries()) {
      const columns = row.querySelectorAll("td") as NodeListOf<HTMLElement>;
      const isHead = !row.classList.contains("bg-white");

      if (isHead) {
        data.push({
          id: index,
          title: columns[0].innerText,
          data: [],
          totalCredit: 0,
          trainingPoint: null,
          avgPoint: { scale10: 0, scale4: 0 }
        });
        continue;
      }

      if (row.classList.contains("table-primary")) {
        const lastGroup = data.at(-1);
        if (lastGroup) {
          const overviewRows = row.querySelectorAll(".row table:first-child tr");
          for (const r of overviewRows) {
            parseOverviewRow(r, lastGroup);
          }
        }
      } else {
        parseDataRow(columns, data);
      }
    }

    if (data.length === 0) {
      return { status: "error", data: null, message: "Không thể đọc dữ liệu từ bảng điểm" };
    }

    return { status: "success", data, message: "" };
  } catch (err) {
    return { status: "error", data: null, message: err instanceof Error ? err.message : "Lỗi khi đọc bảng điểm" };
  }
};

export { getPointData };
