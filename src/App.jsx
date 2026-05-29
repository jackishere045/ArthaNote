// src/App.jsx
import React, { useState } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ArthaNote from "./components/ArthaNote";
import AuthForm from "./components/AuthForm";
import EmailVerificationPage from "./components/EmailVerificationPage";

const MaintenanceModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">🚧</div>
          <div>
            <h2 className="text-white text-xl font-semibold">
              Maintenance Mode
            </h2>
            <p className="text-zinc-400 text-sm">
              ArthaNote sedang maintenance sampai hari ini jam 5 PM.
            </p>
          </div>
        </div>

        <div className="bg-zinc-800/60 rounded-xl p-4 mb-5">
          <p className="text-zinc-300 text-sm leading-relaxed">
            Beberapa fitur mungkin tidak stabil selama proses update AI
            assistant & analytics terbaru.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white py-3 transition"
          >
            Keluar
          </button>

          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white py-3 transition font-medium"
          >
            Tetap Buka
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  const [showMaintenance, setShowMaintenance] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  if (user && !user.emailVerified) {
    return <EmailVerificationPage />;
  }

  return (
    <>
      {showMaintenance && (
        <MaintenanceModal
          onClose={() => setShowMaintenance(false)}
        />
      )}

      <ArthaNote />
    </>
  );
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