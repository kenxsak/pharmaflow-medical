import { useState } from 'react';
import useAxiosInstance from '../../../services/useAxiosInstance';
import { toast } from 'react-toastify';
import { IBranchAndSales } from '../interfaces/IBranchAndSales';
import { Branch } from '../interfaces/Branch';
import { BranchSalesDetails } from '../interfaces/BranchSalesDetails';
import { CashierDetailsType } from '../../cashier-management-dashboard/interfaces/CashierDetailsType';
import { Item } from '../../item-management-window/interfaces/Item';
import { ChangeBranchManagerDTO } from '../interfaces/ChangeBranchManagerDTO';
import { CreateBranchDTO } from '../interfaces/CreateBranchDTO';
import { useNavigate } from 'react-router-dom';

const useBranchManagementService = () => {
  const http = useAxiosInstance();

  const [allBranchSales, setAllBranchSales] = useState<IBranchAndSales[]>();
  const [loadingAllBranchSales, setLoadingAllBranchSales] =
    useState<boolean>(false);
  const fetchAllBranchSales = async () => {
    setLoadingAllBranchSales(true);
    try {
      const response = await http.get('/branch/summary/all');
      const { data } = response;
      setAllBranchSales(data.data.branchSummaries);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch branch sales data');
    } finally {
      setLoadingAllBranchSales(false);
    }
  };

  //TODO: add cors issue is there
  const [branch, setBranch] = useState<Branch>({} as Branch);

  const fetchBranchById = async (branchId: string) => {
    try {
      const res = await http.get(`/branch/get-by-id?branchId=${parseInt(branchId)}`);
      setBranch(res.data.data);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch branch details');
    }
  };
  const [loading, setLoading] = useState(false);
  const [salesSummary, setSalesSummary] = useState<BranchSalesDetails[]>([]);

  const getSalesSummary = async (branchId: string) => {
    setLoading(true);
    try {
      const response = await http.get(
        `/branch/summary/daily-sales/${parseInt(branchId)}`
      );
      setSalesSummary(response.data.data.dailySales);
      setLoading(false);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch sales summary');
    } finally {
      setLoading(false);
    }
  };

  const [branchEmployers, setBranchEmployers] = useState<CashierDetailsType[]>(
    []
  );
  const fetchEmployersByBranchId = async (branchId: string) => {
    try {
      const res = await http.get(
        `/employer/get-by-branch?branchId=${parseInt(branchId)}`
      );
      setBranchEmployers(res.data.data);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch employees');
    }
  };

  const [items, setItems] = useState<Item[]>([]);
  // /lifepill/v1/branch/update-branch/{id}
  const fetchItemsByBranchId = async (branchId: string) => {
    try {
      const res = await http.get(
        `/item/branched/get-item/${parseInt(branchId)}`
      );
      setItems(res.data.data);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch items');
    }
  };

  const [updating, setUpdating] = useState(false);
  const updateBranch = async (id: number, branch: Branch) => {
    try {
      setUpdating(true);
      const res = await http.put(`/branch/update?branchId=${id}`, branch);

      if (res.status === 200) {
        toast.success('Branch updated successfully');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to update branch');
    } finally {
      setUpdating(false);
    }
  };

  const [branchManager, setBranchManager] = useState<CashierDetailsType>(
    {} as CashierDetailsType
  );
  const [branchManagerFetching, setBranchManagerFetching] = useState(false);

  const fetchBranchMangerById = async (branchId: string) => {
    try {
      setBranchManagerFetching(true);
      const res = await http.get(
        `/branch-manager/managers/by-branch/${parseInt(branchId)}`
      );

      if (res.data.code === 200) {
        setBranchManager(res.data.data[0]);
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch branch manager');
    } finally {
      setBranchManagerFetching(false);
    }
  };

  const [branchImage, setBranchImage] = useState<any>();
  const [branchImageFetch, setBranchImageFetch] = useState(false);
  const fetchBranchImage = async (branchId: number) => {
    try {
      setBranchImageFetch(true);
      const res = await http.get(
        `/branch/view-branch-profile-image/${branchId}`,
        {
          responseType: 'arraybuffer',
        }
      );
      const base64String = btoa(
        new Uint8Array(res.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      setBranchImage(`data:image/jpeg;base64,${base64String}`);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch branch image');
    } finally {
      setBranchImageFetch(false);
    }
  };

  const [branchImageUpdate, setBranchImageUpdate] = useState<File | null>();
  const [updatingImage, setUpdatingImage] = useState(false);
  const updateBranchImage = async (branchId: number) => {
    const updateImageFormData = new FormData();
    if (branchImageUpdate) {
      updateImageFormData.append(
        'image',
        branchImageUpdate,
        branchImageUpdate?.name
      );
    } else {
      toast.warning('Please select an image');
      return;
    }
    try {
      setUpdatingImage(true);
      const res = await http.put(
        `/branch/update-branch-profile-image/${branchId}`,
        updateImageFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      toast.success('Branch image updated successfully');
    } catch (error) {
      console.log(error);
      toast.error('Failed to update branch image');
    } finally {
      setUpdatingImage(false);
    }
  };

  const [updatingManager, setUpdatingMaager] = useState(false);
  const changeBranchManagerMethod = async (
    branchMaagerDTO: ChangeBranchManagerDTO
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to change the manager to ${branchMaagerDTO.newManagerId}?`
    );

    if (!confirmed) {
      return;
    }
    try {
      setUpdatingMaager(true);
      const res = await http.post(
        '/branch-manager/change-manager',
        branchMaagerDTO
      );
      if (res.data.code === 200) {
        toast.success('Branch manager changed successfully');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to change branch manager');
    } finally {
      setUpdatingMaager(false);
    }
  };

  const [createBranchDTO, setCreateBranchDTO] = useState<CreateBranchDTO>({
    branchId: 0,
    branchName: '',
    branchAddress: '',
    branchContact: '',
    branchEmail: '',
    branchDescription: '',
    branchStatus: true,
    branchLocation: '',
    branchCreatedOn: '',
    branchCreatedBy: '',
    branchProfileImageUrl: '',
  });

  const [creating, setCreating] = useState(false);
  const [branchImageDTO, setBranchImageDTO] = useState<File | null>();
  const navigate = useNavigate();
  const createBranch = async () => {
    try {
      setCreating(true);
      const res = await http.post('/branch/save', {
        branchName: createBranchDTO.branchName,
        branchAddress: createBranchDTO.branchAddress,
        branchContact: createBranchDTO.branchContact,
        branchFax: createBranchDTO.branchFax,
        branchEmail: createBranchDTO.branchEmail,
        branchDescription: createBranchDTO.branchDescription,
        branchLocation: createBranchDTO.branchLocation,
        branchCreatedBy: createBranchDTO.branchCreatedBy,
        branchLatitude: createBranchDTO.branchLatitude || 0,
        branchLongitude: createBranchDTO.branchLongitude || 0,
      });
      if (res.data.code === 201) {
        // If there's an image, upload it separately
        if (branchImageDTO && res.data.data.branchId) {
          const imageFormData = new FormData();
          imageFormData.append('image', branchImageDTO, branchImageDTO.name);
          await http.put(
            `/branch/update-branch-profile-image/${res.data.data.branchId}`,
            imageFormData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
        }
        toast.success('Branch created successfully');
        navigate('/manager-dashboard/branches');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  return {
    allBranchSales,
    loadingAllBranchSales,
    fetchAllBranchSales,
    fetchBranchById,
    loading,
    getSalesSummary,
    salesSummary,
    fetchEmployersByBranchId,
    branchEmployers,
    branch,
    fetchItemsByBranchId,
    items,
    updating,
    updateBranch,
    fetchBranchMangerById,
    branchManager,
    branchImage,
    fetchBranchImage,
    branchImageUpdate,
    setBranchImageUpdate,
    setBranch,
    updateBranchImage,
    updatingImage,
    changeBranchManagerMethod,
    updatingManager,
    branchManagerFetching,
    branchImageFetch,
    setCreateBranchDTO,
    createBranch,
    creating,
    setBranchImageDTO,
    branchImageDTO,
    createBranchDTO,
  };
};

export default useBranchManagementService;
