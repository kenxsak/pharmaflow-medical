import { useCallback, useState } from 'react';
import useAxiosInstance from '../../login/services/useAxiosInstance';
import { BranchSalesDetails } from '../interfaces/BranchSaleDetails';
import { useUserContext } from '../../../context/UserContext';
import { isPharmaFlowBridgeUser } from '../../../utils/legacySession';

const useSalesSummary = () => {
  const http = useAxiosInstance();
  const [loading, setLoading] = useState(false);
  const [salesSummary, setSalesSummary] = useState<BranchSalesDetails[]>([]);

  const user = useUserContext();

  // Wrapped in useCallback to prevent infinite re-render loop when used as useEffect dependency
  const getSalesSummary = useCallback(async () => {
    if (!user.user?.branchId || isPharmaFlowBridgeUser(user.user)) {
      setSalesSummary([]);
      return;
    }

    setLoading(true);
    try {
      const response = await http.get(
        `/branch-summary/sales-summary/daily/${user.user?.branchId}`
      );
      // Backend returns StandardResponse: { code, message, data }
      // data is a List<DailySalesSummaryDTO> which could be null or an array
      const rawData = response.data?.data;
      const dailySalesData = Array.isArray(rawData)
        ? rawData.map((item: any) => ({
            date: item.date,
            orders: item.orders,
            sales: item.sales,
          }))
        : [];
      setSalesSummary(dailySalesData);
    } catch (error: any) {
      // Empty data (404) or other errors — just set empty
      if (error.response?.status === 404 || error.response?.status === 403) {
        setSalesSummary([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user.user?.branchId]); // http is stable from useAxiosInstance

  return {
    loading,
    getSalesSummary,
    salesSummary,
  };
};

export default useSalesSummary;
