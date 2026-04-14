import { useState } from 'react';
import useAxiosInstance from '../../../services/useAxiosInstance';
import { Item } from '../interfaces/Item';
import { toast } from 'react-toastify';

const useItemService = () => {
  const http = useAxiosInstance();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

  const fetchAllItems = async () => {
    setLoading(true);
    try {
      const res = await http.get('/item/get-all-items');
      const data: Item[] = res.data.data;
      console.log(res.data.data);
      setItems(data);
      setFilteredItems(data);
      // console.log(items);
    } catch (error) {
      console.log(error);
      toast.error('Could not fetch medicine');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    items,
    filteredItems,
    fetchAllItems,
    setFilteredItems
  };
};

export default useItemService;
