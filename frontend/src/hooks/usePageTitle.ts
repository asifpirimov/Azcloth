import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    // Only update if title is provided
    if (title) {
      document.title = `${title} | AzCloth`;
    } else {
      document.title = 'AzCloth';
    }
  }, [title]);
};
