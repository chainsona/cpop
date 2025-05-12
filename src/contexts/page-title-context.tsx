'use client';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// App name constant to ensure consistency
const APP_NAME = 'POP';

type PageTitleContextType = {
  pageTitle: string;
  setPageTitle: (title: string) => void;
};

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitle] = useState<string>('');

  // Update document title when pageTitle changes
  useEffect(() => {
    if (pageTitle) {
      document.title = `${pageTitle} | ${APP_NAME}`;
    } else {
      document.title = APP_NAME;
    }
  }, [pageTitle]);

  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  const context = useContext(PageTitleContext);

  if (context === undefined) {
    throw new Error('usePageTitle must be used within a PageTitleProvider');
  }

  return context;
}
