"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import { axiosClient } from "@/utils/AxiosClient";
import { toast } from "react-toastify";

const MainContext = createContext({
  user: null,
  fetchUserProfile: () => {},
  LogoutHandler: () => {},
  fetchATMDetails: () => {},
  atm: null,
});

export const useMainContext = () => useContext(MainContext);

export const MainContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [atm, setAtm] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // ===============================
  // Fetch User Profile
  // ===============================
const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    console.log("Token:", token);

    if (!token) {
      console.log("No token found");
      setLoading(false);
      return;
    }

    const response = await axiosClient.get("/auth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Profile response:", response.data);

    setUser(response.data);
  } catch (error) {
    console.log("Profile error:", error.response || error);
  } finally {
    setLoading(false);
  }
};

  // ===============================
  // Fetch ATM Details
  // ===============================
  const fetchATMDetails = async (id) => {
    try {
      if (!id) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axiosClient.get(`/atm/get/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAtm(response.data);
    } catch (error) {
      toast.error(error.response?.data?.msg || error.message);
    }
  };

  // ===============================
  // Logout Handler
  // ===============================
 const LogoutHandler = () => {
   // setLoading(true);  // ✅ hides all children, shows Loader instantly
    localStorage.removeItem("token");
    setUser(null);
    setAtm(null);
    toast.success("Logout Successful");
    router.push("/login");
};
  // ===============================
  // Initial Load
  // ===============================
 
 
   useEffect(() => {
    fetchUserProfile();
  }, []);

  // ===============================
  // Show Loader While Checking Auth
  // ===============================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center w-full">
        <Loader />
      </div>
    );
  }

  return (
    <MainContext.Provider
      value={{
        user,
        fetchUserProfile,
        LogoutHandler,
        fetchATMDetails,
        atm,
      }}
    >
      {children}
    </MainContext.Provider>
  );
};