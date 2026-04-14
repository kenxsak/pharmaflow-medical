import React from 'react';
import { Navigate } from 'react-router-dom';
import { getPharmaFlowHomePath, usePharmaFlowContext } from '../../utils/pharmaflowContext';

const PharmaFlowEntry: React.FC = () => {
  const context = usePharmaFlowContext();
  const legacyUserRaw = localStorage.getItem('user');
  let legacyRole = '';

  if (legacyUserRaw) {
    try {
      legacyRole = JSON.parse(legacyUserRaw)?.role || '';
    } catch {
      legacyRole = '';
    }
  }

  if (legacyRole === 'OWNER') {
    return <Navigate to='/manager-dashboard/Dashboard' replace />;
  }

  if (legacyRole) {
    return <Navigate to='/cashier-dashboard' replace />;
  }

  if (context.hasToken) {
    return <Navigate to={getPharmaFlowHomePath(context)} replace />;
  }

  return <Navigate to='/pharmaflow/setup' replace />;
};

export default PharmaFlowEntry;
