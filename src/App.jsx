// src/App.jsx
import React from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ArthaNote from "./components/ArthaNote";
import AuthForm from "./components/AuthForm";
import EmailVerificationPage from "./components/EmailVerificationPage";

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  // Belum login → AuthForm
  if (!user) {
    return <AuthForm />;
  }

  // Sudah login tapi belum verifikasi → EmailVerificationPage
  if (user && !user.emailVerified) {
    return <EmailVerificationPage />;
  }

  // Sudah login & verified → masuk ke ArthaNote
  return <ArthaNote />;
};

const App = () => (
  <ThemeProvider>
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
