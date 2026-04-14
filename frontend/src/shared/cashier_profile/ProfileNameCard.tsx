import React from 'react';
import { useUserContext } from '../../context/UserContext';
import { toLegacyApiUrl } from '../../utils/apiBaseUrls';

type Props = {};

const ProfileNameCard = (props: Props) => {
  const { user } = useUserContext();
  const roleLabel =
    user?.role === 'OWNER'
      ? 'Manager'
      : user?.role === 'CASHIER'
      ? 'Cashier'
      : user?.role || 'User';
  // console.log(`ProfileNameCard: ${user}`);


  return (
    <div className='flex items-center justify-center space-x-2'>
      {/* Details */}
      <div>
        <p className='font-bold text-sm'>{`${roleLabel}-${user?.employerId ?? '-'}`}</p>
        <p className='text-xs'>{`${user?.employerFirstName} ${user?.employerLastName}`}</p>
      </div>
      {/* Image */}
      <div className='w-[60px] h-[60px] rounded-full overflow-hidden relative'>
        <img
          src={
            user
              ? toLegacyApiUrl(`/employers/view-profile-image/${user.employerId}`)
              : 'https://static-00.iconduck.com/assets.00/person-icon-1901x2048-a9h70k71.png'
          }
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
          }}
          alt='Profile'
          className='w-full h-full object-cover'
        />
      </div>
    </div>
  );
};

export default ProfileNameCard;
