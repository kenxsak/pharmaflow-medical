import MainManagerDashboard from '../../../main-manager-dashboard/layout/MainManagerDashboard';

interface DashboardProps {
  onNavigateToOrders?: () => void;
  onOpenWorkspace?: (workspaceKey: string) => void;
}

const Dashboard = ({ onNavigateToOrders, onOpenWorkspace }: DashboardProps) => {
  return (
    <MainManagerDashboard
      onNavigateToOrders={onNavigateToOrders}
      onOpenWorkspace={onOpenWorkspace}
    />
  );
};

export default Dashboard;
