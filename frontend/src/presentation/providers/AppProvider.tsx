import React, { createContext, useContext, useMemo } from 'react';

import { AppContainer, createAppContainer } from '@infrastructure/di/createAppContainer';

const AppContext = createContext<AppContainer | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const container = useMemo(() => createAppContainer(), []);
  return <AppContext.Provider value={container}>{children}</AppContext.Provider>;
}

export function useAppContainer(): AppContainer {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('AppProvider is missing');
  }
  return context;
}
