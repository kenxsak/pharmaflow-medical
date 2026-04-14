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

function OrdersChart({ salesData }: Props) {
  const labels = salesData.map((data) => data.date);
  const orders = salesData.map((data) => data.orderCount);

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Orders',
        data: orders,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className='bg-white rounded-lg shadow-md p-6'>
      <h2 className='text-lg font-semibold text-gray-800 mb-4'>Orders Overview</h2>
      <Bar data={data} options={options} width={1200} height={400} />
    </div>
  );
}

export default OrdersChart;
