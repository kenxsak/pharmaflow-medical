import { useState } from 'react';
import { CashierDetailsType } from '../../cashier-management/interfaces/CashierDetailsType';
import useAxiosInstance from '../../login/services/useAxiosInstance';
import { toast } from 'react-toastify';
import { useUserContext } from '../../../context/UserContext';
import { isPharmaFlowBridgeUser } from '../../../utils/legacySession';

const useCashierService = () => {
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<CashierDetailsType[]>([]);
  const http = useAxiosInstance();
  const { user } = useUserContext();
  const [filteredCashiers, setFilteredCashiers] = useState<
    CashierDetailsType[]
  >([]);

  const fetchEmployeeData = async () => {
    if (isPharmaFlowBridgeUser(user)) {
      setWorkers([]);
      setFilteredCashiers([]);
      return;
    }

    setLoading(true);
    try {
      const res = await http.get('/employers/get-all-employers');
      const data: CashierDetailsType[] = res.data?.data || [];
      setWorkers(data);
      setFilteredCashiers(data);
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        setWorkers([]);
        setFilteredCashiers([]);
      } else {
        toast.error('Error while fetching all employers');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchEmployeeData,
    loading,
    workers,
    setWorkers,
    filteredCashiers,
    setFilteredCashiers,
  };
};

export default useCashierService;
