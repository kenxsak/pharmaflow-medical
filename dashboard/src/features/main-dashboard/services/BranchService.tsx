import { useState } from 'react';
import { IAllBranchDetails } from '../interfaces/IAllBranchDetails';
import useAxiosInstance from '../../../services/useAxiosInstance';
import { toast } from 'react-toastify';
import { IBranchAndSales } from '../../branch-management-dashboard/interfaces/IBranchAndSales';

const useBranchService = () => {
  const [allBranchData, setAllBranchData] = useState<IAllBranchDetails>();
  const [loading, setLoading] = useState<boolean>(false);
  const http = useAxiosInstance();

  const fetchAllBranchDataSummary = async () => {
    setLoading(true);

    try {
      const res = await http.get('/branch/summary/all');
      console.log(res.data);
      const { data } = res;
      console.log(data.data);
      setAllBranchData(data.data);
      console.log(allBranchData);
    } catch (error) {
      console.log(error);
      toast.error('error');
    } finally {
      setLoading(false);
    }
  };

  const [allBranchSales, setAllBranchSales] = useState<IBranchAndSales[]>();
  const [loadingAllBranchSales, setLoadingAllBranchSales] =
    useState<boolean>(false);
  const fetchAllBranchSales = async () => {
    setLoadingAllBranchSales(true);
    try {
      const response = await http.get('/branch/summary/all');
      const { data } = response;
      setAllBranchSales(data.data.branchSummaries);
      console.log(allBranchSales);
    } catch (error) {
      console.log(error);
      toast.error('Error');
    } finally {
      setLoadingAllBranchSales(false);
    }
  };

  return {
    allBranchData,
    loading,
    fetchAllBranchDataSummary,
    loadingAllBranchSales,
    fetchAllBranchSales,
    allBranchSales,
  };
};

export default useBranchService;
