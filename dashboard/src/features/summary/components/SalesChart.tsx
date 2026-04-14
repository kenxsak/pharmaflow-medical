import React, { useEffect, useState } from 'react';
import { BranchSalesData } from '../interfaces/BranchSales';
import { Line } from 'react-chartjs-2';
import { BsGraphUp } from 'react-icons/bs';

type Props = {
  branchSalesOrders: BranchSalesData[];
};

function SalesChart({ branchSalesOrders }: Props) {
  // Define state to hold chart data
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    // When branchSalesOrders state updates, format data for chart
    if (branchSalesOrders.length > 0) {
      // Find the longest array of dates
      const longestDailySalesSummary = branchSalesOrders.reduce(
        (prev, current) =>
          prev.dailySales.length > current.dailySales.length
            ? prev
            : current
      );

      // Use the dates from the longest array of daily sales summaries
      const labels = longestDailySalesSummary.dailySales.map(
        (summary) => summary.date
      );

      const datasets = branchSalesOrders.map((branch) => ({
        label: `${branch.branchName}`,
        data: branch.dailySales.map((summary) => summary.totalSales),
        fill: false,
        borderColor: getRandomColor(),
        tension: 0.1,
      }));

      setChartData({ labels, datasets });
    }
  }, [branchSalesOrders]);

  // Function to generate random color
  const getRandomColor = () => {
    return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(
      Math.random() * 256
    )}, ${Math.floor(Math.random() * 256)})`;
  };

  // Options for chart customization
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div className='bg-white rounded-lg shadow-md p-6'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='p-2 bg-green-100 rounded-lg'>
          <BsGraphUp className='text-xl text-green-600' />
        </div>
        <div>
          <h2 className='text-lg font-bold text-gray-800'>Sales Performance</h2>
          <p className='text-sm text-gray-600'>Daily sales trends across branches</p>
        </div>
      </div>
      <div className='w-full'>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

export default SalesChart;
