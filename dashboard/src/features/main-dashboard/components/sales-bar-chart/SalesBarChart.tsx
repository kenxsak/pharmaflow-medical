import React, { useEffect } from 'react';
import useBranchService from '../../services/BranchService';
import { Bar } from 'react-chartjs-2';
import { BiLoader } from 'react-icons/bi';

type Props = {};

function SalesBarChart({}: Props) {
  const { allBranchSales, loadingAllBranchSales, fetchAllBranchSales } =
    useBranchService();

  useEffect(() => {
    fetchAllBranchSales();
  }, []);

  const branchNames = allBranchSales?.map(
    (branch) => branch.branchName
  );
  const salesData = allBranchSales?.map((branch) => branch.totalSales);

  const data = {
    labels: branchNames,
    datasets: [
      {
        label: 'Sales',
        data: salesData,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
      },
    ],
  };

  return (
    <div className='bg-white rounded-lg shadow-md p-6 sales-bar-chart'>
      <h2 className='text-2xl font-semibold mb-2'>Sales Bar Chart</h2>
      <div className='w-full h-auto'>
        {loadingAllBranchSales ? (
          <BiLoader className='animate-spin text-4xl text-blue-500' />
        ) : (
          <Bar data={data} width={500} height={250} />
        )}
      </div>
    </div>
  );
}

export default SalesBarChart;
