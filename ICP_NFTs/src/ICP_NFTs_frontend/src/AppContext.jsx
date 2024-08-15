import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [actor, setActor] = useState(null);
  const [authClient, setAuthClient] = useState(null);

  return (
    <AppContext.Provider value={{ actor, setActor, authClient, setAuthClient }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);