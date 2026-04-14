import { useState } from 'react';
import useAxiosInstance from '../../../services/useAxiosInstance';
import { BranchSalesData } from '../interfaces/BranchSales';
import { toast } from 'react-toastify';

const useSummaryService = () => {
  const http = useAxiosInstance();

  const [branchSalesOrders, setBranchSalesOrders] = useState(
    [] as BranchSalesData[]
  );
  const [filterBranchSalesData, setFilterBranchSalesData] = useState(
    [] as BranchSalesData[]
  );
  const [loading, setLoading] = useState(false);

  const getAllBranchesSales = async () => {
    try {
      setLoading(true);
      const res = await http.get(
        '/branch/summary/daily-sales'
      );

      setBranchSalesOrders(res.data.data);
      setFilterBranchSalesData(res.data.data);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  return {
    getAllBranchesSales,
    branchSalesOrders,
    filterBranchSalesData,
    loading,
  };
};

export default useSummaryService;
