import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

const SESSION_TIMEOUT_MINUTES = 15;

export function AuthProvider({ children }) {
  // userData puede contener usuario, contrasenia, imei, mac, token, loginTimestamp, etc.
  const [userData, setUserData] = useState(null);
  const [catalogos, setCatalogos] = useState(null);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState(null);

  // Lógica para timeout absoluto desde login
  const checkSessionExpired = () => {
    if (!userData) return false;
    const now = Date.now();
    // Si existe tokenExp, úsalo como referencia principal
    if (userData.tokenExp && now > userData.tokenExp) return true;
    // Si no, usa el timeout absoluto desde login
    if (userData.loginTimestamp) {
      const elapsed = now - userData.loginTimestamp;
      if (elapsed > SESSION_TIMEOUT_MINUTES * 60 * 1000) return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      userData, 
      setUserData, 
      checkSessionExpired,
      catalogos,
      setCatalogos,
      loadingCatalogos,
      setLoadingCatalogos,
      errorCatalogos,
      setErrorCatalogos
    }}>
      {children}
    </AuthContext.Provider>
  );
}

