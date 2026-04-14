import React, { useState } from 'react';
import SideBar from '../features/manager-dashboard/components/sidebar/SideBar';
import { useParams } from 'react-router-dom';
import { renderComponent } from '../utils/renderComponent';

type Props = {};

const ManagerDashboard: React.FC<Props> = () => {
  const { item } = useParams();
  const [activeComponent, setActiveComponent] = useState(item || 'dashboard');

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <SideBar setActiveComponent={setActiveComponent} />
      <main className='flex-1 w-full'>{renderComponent(activeComponent)}</main>
    </div>
  );
};

export default ManagerDashboard;
