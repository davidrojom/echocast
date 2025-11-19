import { useState, useEffect } from "react";

export const useClientOnly = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {

    const timer = setTimeout(() => {
      setIsClient(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return isClient;
};
