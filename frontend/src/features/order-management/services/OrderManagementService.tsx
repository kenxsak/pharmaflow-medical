import { useState } from 'react';
import useAxiosInstance from '../../login/services/useAxiosInstance';
import { Order } from '../interfaces/OrderDetails';
import { filterOrdersByBranch } from '../utils/filterUtils';
import { useUserContext } from '../../../context/UserContext';
import { isPharmaFlowBridgeUser } from '../../../utils/legacySession';

const useOrderManagementService = () => {
  const [loading, setLoading] = useState(false);
  const http = useAxiosInstance();
  const [orderData, setOrderData] = useState<Order[]>();
  const [filteredOrderData, setFilteredOrderData] = useState<Order[]>();
  const user = useUserContext();
  const fetchOrderData = async () => {
    if (!user.user?.branchId || isPharmaFlowBridgeUser(user.user)) {
      setOrderData([]);
      setFilteredOrderData([]);
      return;
    }

    try {
      setLoading(true);
      const res = await http.get(
        `/order/getOrderWithDetailsByBranchId/${user.user?.branchId}`
      );
      setOrderData(res.data.data);
      setFilteredOrderData(res.data.data);
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        setOrderData([]);
        setFilteredOrderData([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    orderData,
    fetchOrderData,
    setFilteredOrderData,
    filteredOrderData,
  };
};

export default useOrderManagementService;
