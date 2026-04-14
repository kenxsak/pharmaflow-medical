import React, { createContext, useContext, useState } from 'react';
import { IEmployeeInterface } from '../interfaces/IEmployeeInterface';

interface UserContextType {
  user: IEmployeeInterface | null;
  setUser: (user: IEmployeeInterface | null) => void;
  cookie: String | null;
  setCookie: (cookie: String | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const hydrateStoredUser = (storedUser: string | null): IEmployeeInterface | null => {
  if (!storedUser) {
    return null;
  }

  const parsedUser = JSON.parse(storedUser) as IEmployeeInterface;
  if (parsedUser && !parsedUser.authSource && localStorage.getItem('pharmaflow_token')) {
    return {
      ...parsedUser,
      authSource: 'pharmaflow-bridge',
    };
  }

  return parsedUser;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<IEmployeeInterface | null>(() => {
    // Initialize user from local storage if available
    const storedUser = localStorage.getItem('user');
    return hydrateStoredUser(storedUser);
  });

  const [cookie, setCookie] = useState<String | null>(() => {
    const storedCookie = localStorage.getItem('cookie');
    return storedCookie ? JSON.parse(storedCookie) : null;
  });

  // Wrapper function to persist cookie to localStorage
  const handleSetCookie = (newCookie: String | null) => {
    setCookie(newCookie);
    if (newCookie) {
      localStorage.setItem('cookie', JSON.stringify(newCookie));
    } else {
      localStorage.removeItem('cookie');
    }
  };

  // Wrapper function to persist user to localStorage
  const handleSetUser = (newUser: IEmployeeInterface | null) => {
    const normalizedUser =
      newUser && !newUser.authSource && localStorage.getItem('pharmaflow_token')
        ? {
            ...newUser,
            authSource: 'pharmaflow-bridge' as const,
          }
        : newUser;

    setUser(normalizedUser);
    if (normalizedUser) {
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser: handleSetUser, cookie, setCookie: handleSetCookie }}>
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
