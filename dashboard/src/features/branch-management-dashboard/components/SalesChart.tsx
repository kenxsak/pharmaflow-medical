import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { BranchSalesDetails } from '../interfaces/BranchSalesDetails';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  salesData: BranchSalesDetails[];
}

const SalesChart: React.FC<Props> = ({ salesData }) => {
  const labels = salesData.map((data) => data.date);
  const sales = salesData.map((data) => data.totalSales);

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Sales',
        data: sales,
        backgroundColor: 'rgba(255, 192, 203, 0.2)', // Pink background color
        borderColor: 'rgba(255, 192, 203, 1)', // Pink border color
        borderWidth: 1,
      },
    ],
  };

  const options = {
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className='bg-white rounded-lg shadow-md p-6'>
      <h2 className='text-lg font-semibold text-gray-800 mb-4'>Sales Overview</h2>
      <Bar data={data} options={options} width={1200} height={400} />
    </div>
  );
};

export default SalesChart;
