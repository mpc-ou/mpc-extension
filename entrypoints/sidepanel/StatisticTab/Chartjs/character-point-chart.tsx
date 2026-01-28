import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Pie } from "react-chartjs-2";
import type { PointCharacterType } from "@/entrypoints/sidepanel/PointTab/type";

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

type Props = {
  total: number;
  data: { [key in Exclude<PointCharacterType, "M">]: number };
};

const CharacterPointChart = ({ total, data }: Props) => {
  const labels = Object.keys(data);
  const values = Object.values(data);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Điểm hệ 10",
        data: values,
        backgroundColor: [
          "rgb(0, 128, 0)",
          "rgb(50, 205, 50)",
          "rgb(30, 144, 255)",
          "rgb(70, 130, 180)",
          "rgb(255, 165, 0)",
          "rgb(255, 140, 0)",
          "rgb(255, 69, 0)",
          "rgb(220, 20, 60)",
          "rgb(128, 0, 0)",
          "rgb(105, 105, 105)"
        ]
      }
    ]
  };

  const datalabelsOptions = {
    color: "#fff",
    font: { weight: "bold" as const, size: 12 },
    formatter: (value: number) => {
      if (value === 0) {
        return null;
      }
      return value;
    }
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `PHÂN BỐ ĐIỂM THEO THANG ĐIỂM CHỮ (${total} môn)`,
        font: { size: 15 }
      },
      legend: {
        position: "bottom" as const
      },
      datalabels: datalabelsOptions
    }
  };

  return (
    <div className='p-6'>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export { CharacterPointChart };
