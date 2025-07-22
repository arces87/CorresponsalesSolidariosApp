import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  // userData puede contener usuario, contrasenia, imei, mac, token, etc.
  const [userData, setUserData] = useState(null);

  return (
    <AuthContext.Provider value={{ userData, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
