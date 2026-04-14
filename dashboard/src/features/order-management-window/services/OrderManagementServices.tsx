import { useState } from 'react';
import useAxiosInstance from '../../../services/useAxiosInstance';
import { Order } from '../interfaces/OrderDetails';
import { Branch } from '../../branch-management-dashboard/interfaces/Branch';
import { toast } from 'react-toastify';

const useOrderManagementService = () => {
  const [loading, setLoading] = useState(false);
  const http = useAxiosInstance();
  const [orderData, setOrderData] = useState<Order[]>();
  const [filteredOrderData, setFilteredOrderData] = useState<Order[]>();

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const res = await http.get('/order/getAllOrdersWithDetails');
      setOrderData(res.data.data);
      setFilteredOrderData(res.data.data);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch order data');
    } finally {
      setLoading(false);
    }
  };

  const [branches, setBranches] = useState<Branch[]>();

  const fetchAllBranches = async () => {
    try {
      const res = await http.get('/branch/get-all-branches');
      setBranches(res.data.data);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch branches');
    }
  };

  return {
    loading,
    orderData,
    fetchOrderData,
    setFilteredOrderData,
    filteredOrderData,
    branches,
    fetchAllBranches,
  };
};

export default useOrderManagementService;
