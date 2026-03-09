"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface UserContextType {
  userName: string | null;
  setUserName: (name: string) => void;
}

const UserContext = createContext<UserContextType>({
  userName: null,
  setUserName: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("jobbot_user");
    if (stored) setUserNameState(stored);
  }, []);

  const setUserName = (name: string) => {
    setUserNameState(name);
    localStorage.setItem("jobbot_user", name);
  };

  return (
    <UserContext.Provider value={{ userName, setUserName }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
