import { createContext, useContext, useState } from 'react';
import { IEmployeeInterface } from '../interfaces/IEmployeeInterface';

interface UserContextType {
  user: IEmployeeInterface | null;
  setUser: (user: IEmployeeInterface) => void;
  cookie: String | null;
  setCookie: (cookie: String) => void;
  refreshToken: String | null;
  setRefreshToken: (token: String) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<IEmployeeInterface | null>(() => {
    // Initialize user from local storage if available
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [cookie, setCookie] = useState<String | null>(() => {
    const storedCookie = localStorage.getItem('cookie');
    return storedCookie ? JSON.parse(storedCookie) : null;
  });

  const [refreshToken, setRefreshToken] = useState<String | null>(() => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    return storedRefreshToken ? JSON.parse(storedRefreshToken) : null;
  });

  return (
    <UserContext.Provider value={{ user, setUser, cookie, setCookie, refreshToken, setRefreshToken }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
