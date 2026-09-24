import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

type AdminMoreContextValue = {
  moreOpen: boolean;
  setMoreOpen: (open: boolean) => void;
};

const AdminMoreContext = createContext<AdminMoreContextValue | null>(null);

export function AdminMoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  const value = useMemo(
    () => ({ moreOpen, setMoreOpen }),
    [moreOpen],
  );

  return (
    <AdminMoreContext.Provider value={value}>
      {children}
    </AdminMoreContext.Provider>
  );
}

export function useAdminMore() {
  const ctx = useContext(AdminMoreContext);
  if (!ctx) {
    throw new Error("useAdminMore must be used within AdminMoreProvider");
  }
  return ctx;
}