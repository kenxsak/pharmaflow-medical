import { BranchSalesDetails } from '../interfaces/BranchSalesDetails';

// Function to generate monthly sales summary from daily sales data
export const generateMonthlySalesSummary = (
  dailySalesSummary: BranchSalesDetails[]
): BranchSalesDetails[] => {
  const monthlySalesSummary: { [key: string]: BranchSalesDetails } = {};

  // Loop through each daily sales data
  dailySalesSummary.forEach((dailyData) => {
    const monthYear = dailyData.date.slice(0, 7); // Extract YYYY-MM from the date

    // If the month-year key does not exist, initialize it
    if (!monthlySalesSummary[monthYear]) {
      monthlySalesSummary[monthYear] = {
        date: monthYear,
        orderCount: 0,
        totalSales: 0,
      };
    }

    // Aggregate orders and sales for the month
    monthlySalesSummary[monthYear].orderCount += dailyData.orderCount;
    monthlySalesSummary[monthYear].totalSales += dailyData.totalSales;
  });

  // Convert the monthly sales summary object to an array
  const monthlySalesSummaryArray = Object.values(monthlySalesSummary);

  return monthlySalesSummaryArray;
};
