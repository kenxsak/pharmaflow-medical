import React from 'react';
import { useUserContext } from '../../context/UserContext';
import { toLegacyApiUrl } from '../../utils/apiBaseUrls';
import { isPharmaFlowBridgeUser } from '../../utils/legacySession';

type Props = {};

const DEFAULT_PROFILE_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

const ProfileNameCard = (props: Props) => {
  const { user } = useUserContext();
  const roleLabel =
    user?.role === 'OWNER'
      ? 'Manager'
      : user?.role === 'CASHIER'
      ? 'Cashier'
      : user?.role || 'User';
  // console.log(`ProfileNameCard: ${user}`);


  const profileImageSrc = user?.profileImageUrl
    ? user.profileImageUrl
    : user && !isPharmaFlowBridgeUser(user)
    ? toLegacyApiUrl(`/employers/view-profile-image/${user.employerId}`)
    : DEFAULT_PROFILE_IMAGE;

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
          src={profileImageSrc}
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_PROFILE_IMAGE;
          }}
          alt='Profile'
          className='w-full h-full object-cover'
        />
      </div>
    </div>
  );
};

export default ProfileNameCard;
