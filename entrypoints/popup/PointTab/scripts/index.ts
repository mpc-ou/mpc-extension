import { PointCharacterType, ScoreGroupType } from "../type";

const getPointData = () => {
  const tableRows = document.querySelectorAll(
    "table#excel-table > tbody > tr.ng-star-inserted:not(.table-primary), table#excel-table > tbody > tr.text-center.ng-star-inserted"
  );

  const data: ScoreGroupType[] = [];

  Array.from(tableRows).forEach((row, index) => {
    const columns = row.querySelectorAll("td");

    const isHead = !row.classList.contains("bg-white");

    if (isHead) {
      data.push({
        id: index,
        title: columns[0].innerText,
        data: [],
        totalCredit: 0,
        avgPoint: {
          scale10: 0,
          scale4: 0
        }
      });
    }

    if (!isHead) {
      const character = columns[11].innerText as PointCharacterType;

      data.at(-1)?.data.push({
        code: columns[1].innerText,
        name: columns[3].innerText,
        credit: Number.parseFloat(columns[4].innerText) || 0,
        point: {
          scale10: Number.parseFloat(columns[9].innerText),
          scale4: Number.parseFloat(columns[10].innerText),
          character
        }
      });
    }
  });

  return data;
};

export { getPointData };
