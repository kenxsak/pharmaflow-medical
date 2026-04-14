import { useState } from 'react';
import useAxiosInstance from '../../login/services/useAxiosInstance';
import { IBranchData } from '../interfaces/IBranchData';
import { useUserContext } from '../../../context/UserContext';
import { toast } from 'react-toastify';
import { isPharmaFlowBridgeUser } from '../../../utils/legacySession';

const UseBranchService = () => {
  const http = useAxiosInstance();
  const [branchData, setBranchData] = useState<IBranchData>();
  // const { user } = useUserContext(); //dont remove this from code because this is for the branch id
  // const branchID = ; //replace this with actual id
  const [loading, setLoading] = useState<boolean>(false);
  const user = useUserContext();

  const buildFallbackBranchData = (): IBranchData => ({
    branchId: user.user?.branchId || 0,
    branchName:
      localStorage.getItem('pharmaflow_store_code') ||
      'LifePill Main Branch',
    branchAddress:
      user.user?.employerAddress ||
      localStorage.getItem('pharmaflow_brand_tagline') ||
      'Legacy workspace is ready for daily billing and store operations.',
    branchContact:
      user.user?.employerPhone ||
      localStorage.getItem('pharmaflow_brand_support_phone') ||
      '-',
    branchEmail:
      user.user?.employerEmail ||
      localStorage.getItem('pharmaflow_brand_support_email') ||
      '-',
    branchLocation: 'Tamil Nadu branch workspace',
    branchStatus: true,
    branchImageUrl: null,
    totalSales: 0,
    orderCount: 0,
    employeeCount: 1,
    itemCount: 0,
    lowStockItemCount: 0,
  });

  const fetchBranchData = async () => {
    if (!user.user?.branchId || isPharmaFlowBridgeUser(user.user)) {
      setBranchData(buildFallbackBranchData());
      return;
    }

    try {
      setLoading(true);
      const res = await http.get(
        `/branch-summary/sales-summary/${user.user?.branchId}`
      );
      const { data: responseBody } = res;
      const payload = responseBody.data;

      // Map PharmacyBranchResponseDTO to IBranchData
      const mappedData: IBranchData = {
        branchId: payload.branchDTO?.branchId || 0,
        branchName: payload.branchDTO?.branchName || '',
        branchAddress: payload.branchDTO?.branchAddress || '',
        branchContact: payload.branchDTO?.branchContact || '',
        branchEmail: payload.branchDTO?.branchEmail || '',
        branchLocation: payload.branchDTO?.branchLocation || '',
        branchStatus: payload.branchDTO?.branchStatus || false,
        branchImageUrl: payload.branchDTO?.branchProfileImageUrl || null,
        totalSales: payload.sales || 0,
        orderCount: payload.orders || 0,
        employeeCount: 0, // Fallback as employeeCount isn't directly in this DTO
        itemCount: 0, // Fallback
        lowStockItemCount: 0 // Fallback
      };
      
      setBranchData(mappedData);
    } catch (error: any) {
      setBranchData(buildFallbackBranchData());
      if (error.response?.status && error.response.status >= 500) {
        toast.error('Unable to fetch branch details right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchBranchData,
    branchData,
    loading,
  };
};

export default UseBranchService;
