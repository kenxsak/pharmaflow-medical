import { useState } from 'react';
import { CashierDetailsType } from '../interfaces/CashierDetailsType';
import { toast } from 'react-toastify';
import useAxiosInstance from '../../../services/useAxiosInstance';
import { ComponentState, useCashierContext } from '../layouts/AddCashier';
import { validateEmail } from '../utils/validators/EmailValidator';
import { passwordsMatch } from '../utils/validators/PasswordValidator';
import { useNavigate } from 'react-router-dom';
import { Branch } from '../interfaces/Branch';
import { useUserContext } from '../../../context/UserContext';

const useCashierCRUDService = () => {
  const http = useAxiosInstance();
  const [loading, setLoading] = useState(false);
  const { setCurrentComponent } = useCashierContext();
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const user = useUserContext();

  // const createCashier = async (employer: CashierDetailsType) => {
  //   if (
  //     !employer ||
  //     !employer.branchId ||
  //     !employer.employerNicName ||
  //     !employer.employerFirstName ||
  //     !employer.employerLastName ||
  //     !employer.employerPassword ||
  //     !employer.employerEmail ||
  //     !employer.employerPhone ||
  //     !employer.employerAddress ||
  //     !employer.employerSalary ||
  //     !employer.employerNic ||
  //     !employer.gender ||
  //     !employer.dateOfBirth ||
  //     !employer.role ||
  //     !employer.pin
  //   ) {
  //     toast.error('Please provide all required information.');
  //     return;
  //   }

  //   // if (
  //   //   !passwordsMatch(
  //   //     employer.employerPassword,
  //   //     employer.employerConfirmPassword
  //   //   )
  //   // ) {
  //   //   toast.error('Passwords do not match.');
  //   //   return;
  //   // }

  //   if (
  //     !['OWNER', 'CASHIER', 'MANAGER'].includes(employer.role.toUpperCase())
  //   ) {
  //     toast.error(
  //       'Invalid role. Role should be either OWNER, CASHIER, or MANAGER.'
  //     );
  //     return;
  //   }

  //   if (!validateEmail(employer.employerEmail)) {
  //     toast.error('Invalid email');
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const res = await http.post('/employers/save-without-image', employer);

  //     console.log(res.data);
  //     if (res.data.code === 201) {
  //       const createdCashierData = res.data.data;
  //       setCurrentComponent(ComponentState.BankDetails);
  //       console.log('Created cashier:', createdCashierData.employerId);
  //       toast.success('Cashier created successfully!');
  //       return createdCashierData.employerId;
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     toast.error('Failed to create a cashier');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const createCashier = async (employer: CashierDetailsType) => {
    if (
      !employer ||
      !employer.branchId ||
      !employer.employerNicName ||
      !employer.employerFirstName ||
      !employer.employerLastName ||
      !employer.employerPassword ||
      !employer.employerEmail ||
      !employer.employerPhone ||
      !employer.employerAddress ||
      !employer.employerSalary ||
      !employer.employerNic ||
      !employer.gender ||
      !employer.dateOfBirth ||
      !employer.role ||
      !employer.pin
    ) {
      toast.error('Please provide all required information.');
      return;
    }

    // if (
    //   !passwordsMatch(
    //     employer.employerPassword,
    //     employer.employerConfirmPassword
    //   )
    // ) {
    //   toast.error('Passwords do not match.');
    //   return;
    // }

    if (
      !['OWNER', 'CASHIER', 'MANAGER'].includes(employer.role.toUpperCase())
    ) {
      toast.error(
        'Invalid role. Role should be either OWNER, CASHIER, or MANAGER.'
      );
      return;
    }

    if (!validateEmail(employer.employerEmail)) {
      toast.error('Invalid email');
      return;
    }

    const formData = new FormData();
    console.log('Employer object:', employer);
    console.log('FormData before append:', formData);
    
    if (profilePicture) {
      formData.append('file', profilePicture, profilePicture.name);
    }

    console.log('FormData after append:', formData);

    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    setLoading(true);
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        branchId: employer.branchId.toString(),
        employerFirstName: employer.employerFirstName,
        employerLastName: employer.employerLastName,
        employerNicName: employer.employerNicName,
        employerEmail: employer.employerEmail,
        employerPassword: employer.employerPassword,
        employerPhone: employer.employerPhone,
        employerAddress: employer.employerAddress,
        employerSalary: employer.employerSalary.toString(),
        employerNic: employer.employerNic,
        gender: employer.gender,
        dateOfBirth: employer.dateOfBirth.toString().split('-').join('/'),
        role: employer.role,
        pin: employer.pin.toString(),
      });

      const res = await http.post(
        `/employer/save-employer-with-image?${params.toString()}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log(res.data);
      if (res.data.code === 200 || res.data.code === 201) {
        const createdCashierData = res.data.data;
        setCurrentComponent(ComponentState.BankDetails);
        console.log('Created cashier:', createdCashierData.employerId);
        toast.success('Cashier created successfully!');
        return createdCashierData.employerId;
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to create a cashier');
    } finally {
      setLoading(false);
    }
  };

  const [cashierDetails, setCashierDetails] = useState({
    employerId: 0,
    employerNicName: '',
    employerFirstName: '',
    employerLastName: '',
    employerEmail: '',
    employerPhone: '',
    employerPassword: '',
    employerConfirmPassword: '',
    profileImage: '',
    branchId: 0,
    employerNic: '',
    dateOfBirth: '',
    employerAddress: '',
    pin: 0,
    role: 'CASHIER',
    employerSalary: 0,
    gender: 'MALE',
    profileImageUrl: '',
  });

  const fetchCashierById = async (employerId: Number) => {
    try {
      setLoading(true);
      console.log('Fetching cashier by id', employerId);
      const res = await http.get('/employer/get-by-id', {
        params: { employerId },
      });
      console.log(res);
      if (res.status === 200) {
        setCashierDetails(res.data.data);
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const updateCashier = async (employer: any) => {
    try {
      if (
        !employer ||
        !employer.branchId ||
        !employer.employerNicName ||
        !employer.employerFirstName ||
        !employer.employerLastName ||
        !employer.employerPassword ||
        !employer.employerEmail ||
        !employer.employerPhone ||
        !employer.employerAddress ||
        !employer.employerSalary ||
        !employer.employerNic ||
        !employer.gender ||
        !employer.dateOfBirth ||
        !employer.role ||
        !employer.pin
      ) {
        toast.error('Please provide all required information.');
        return;
      }

      // if (   !passwordsMatch(
      //     employer.employerPassword,
      //     employer.employerConfirmPassword
      //   )
      // ) {
      //   toast.error('Passwords do not match.');
      //   return;
      // }

      if (
        !['OWNER', 'CASHIER', 'MANAGER'].includes(employer.role.toUpperCase())
      ) {
        toast.error(
          'Invalid role. Role should be either OWNER, CASHIER, or MANAGER.'
        );
        return;
      }

      if (!validateEmail(employer.employerEmail)) {
        toast.error('Invalid email');
        return;
      }

      setUpdating(true);
      const res = await http.put(
        `/employer/${employer.employerId}`,
        employer
      );
      if (res.status === 200) {
        toast.success('Cashier updated successfully!');
        setCurrentComponent(ComponentState.BankDetails);
      }
      console.log(res);
    } catch (error) {
      console.log(error);
      toast.error('Failed to update cashier');
    } finally {
      setUpdating(false);
    }
  };

  const deleteCashierById = async (id: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete cashier ${id}?`
    );
    if (confirmed) {
      try {
        setLoading(true);
        console.log('Deleting cashier by id', id);
        const res = await http.delete(`/employers/delete-employerId/${id}`);
        console.log(res);
        toast.success('Cashier deleted successfully');
      } catch (error) {
        console.log(error);
        toast.error('Failed to delete cashier');
      } finally {
        setLoading(false);
        navigate('/manager-dashboard/cashiers');
      }
    } else {
      // Show message if user cancels deletion
      toast.info('Deletion canceled.');
    }
  };

  const [branches, setBranches] = useState<Branch[]>([]);

  const fetchAllBranches = async () => {
    try {
      const res = await http.get('/branch/get-all-branches');
      console.log(res);
      setBranches(res.data.data);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch branches');
    }
  };

  const updateProfileImage = async (employerId: number) => {
    try {
      const res = await http.put(
        `/employer/update-employer-image/${employerId}`
      );
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  const [profileImageUrl, setProfileImageUrl] = useState<any>();
  const [fetchProfilePicture, setFetchProfilePicture] =
    useState<boolean>(false);
  const fetchImageOfEmployer = async (employerId: number) => {
    try {
      setFetchProfilePicture(true);
      const res = await http.get(
        `/employer/view-profile-image/${employerId}`
      );
      console.log(res); // Check the response in console if needed

      // Set the profile image URL from the response
      setProfileImageUrl(res.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setFetchProfilePicture(false);
    }
  };

  const [updateState, setUpdateState] = useState<boolean>(false);
  const updateEmployerImage = async (employerId: number) => {
    const updateImageFormData = new FormData();
    if (profilePicture) {
      updateImageFormData.append('file', profilePicture, profilePicture?.name);
    } else {
      toast.warning('Please select a image');
    }
    try {
      setUpdateState(true);
      const res = await http.put(
        `/employer/update-employer-image/${employerId}`,
        updateImageFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log(res);
      if (res.status === 200) {
        toast.success('Image updated successfully');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to update profile picture');
    } finally {
      setUpdateState(false);
    }
  };

  return {
    createCashier,
    loading,
    fetchCashierById,
    cashierDetails,
    setCashierDetails,
    updateCashier,
    updating,
    deleteCashierById,
    fetchAllBranches,
    branches,
    profilePicture,
    setProfilePicture,
    updateProfileImage,
    fetchImageOfEmployer,
    updateEmployerImage,
    fetchProfilePicture,
    profileImageUrl,
    updateState,
  };
};

export default useCashierCRUDService;
