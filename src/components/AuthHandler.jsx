// src/components/AuthHandler.jsx
import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import AuthForm from "./AuthForm";

const AuthHandler = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  // Jika user belum login atau belum verifikasi email
  if (!user || !user.emailVerified) {
    return <AuthForm />;
  }

  // Jika user sudah login dan email terverifikasi
  return children;
};

export default AuthHandler;