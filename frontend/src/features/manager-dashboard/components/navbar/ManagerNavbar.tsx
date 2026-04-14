import ProfileNameCard from '../../../../shared/cashier_profile/ProfileNameCard';
import DateAndTimeNavBar from '../../../../shared/clock/DateAndTimeNavBar';
import Divider from '../../../../shared/divider/Divider';
import Logo from '../../../../assets/logo/logo.png';

interface ManagerNavbarProps {
  title?: string;
}

const ManagerNavbar = ({ title = 'Dashboard' }: ManagerNavbarProps) => {
  return (
    <div
      className='flex items-center justify-between w-full p-2 font-poppins shadow-md'
      data-testid='cypress-manager-navbar'
    >
      <div className='flex flex-row items-center justify-center gap-4'>
        {/* Logo */}
        <div>
          <img src={Logo} alt='Logo' width={60} height={60} />
        </div>

        <div>
          <h2 className='font-medium text-lg'>{title}</h2>
          <p className='text-xs text-slate-500'>Simple legacy workspace</p>
        </div>
      </div>

      <div className='flex flex-row items-center justify-center gap-2'>
        {/* Date and time */}
        <DateAndTimeNavBar />

        <Divider />

        {/* Cashier name,number and profile picture */}
        <ProfileNameCard />
      </div>
    </div>
  );
};

export default ManagerNavbar;
