// src/components/EmailVerificationPage.jsx
import React, { useState, useEffect } from "react";
import { auth } from "../firebase/config";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { signOut } from "firebase/auth";
import { CheckCircle, Mail, RefreshCw, AlertCircle } from "lucide-react";

const EmailVerificationPage = ({ onVerificationComplete }) => {
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsVerified(currentUser.emailVerified);
      }
    });

    return () => unsubscribe();
  }, []);

  // Countdown untuk tombol resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCheckVerification = async () => {
    if (!user) return;

    setIsChecking(true);
    setError("");

    try {
      await user.reload(); // ✅ reload user
      if (user.emailVerified) {
        setIsVerified(true);
        setMessage("Email berhasil diverifikasi! Anda akan diarahkan ke login.");
        setTimeout(async () => {
          await signOut(auth); // ✅ logout biar balik ke login
          if (onVerificationComplete) {
            onVerificationComplete();
          }
        }, 2000);
      } else {
        setError("Email belum diverifikasi. Silakan cek email Anda dan klik link verifikasi.");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memeriksa verifikasi. Silakan coba lagi.");
      console.error("Error checking verification:", err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user || resendCooldown > 0) return;

    try {
      await sendEmailVerification(user);
      setMessage("Email verifikasi berhasil dikirim ulang! Silakan cek email Anda.");
      setError("");
      setResendCooldown(60); // cooldown 60 detik
    } catch (err) {
      setError("Gagal mengirim ulang email verifikasi. Silakan coba lagi nanti.");
      console.error("Error resending verification:", err);
    }
  };

  // ✅ Tampilan ketika sudah terverifikasi
  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Email Terverifikasi!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Selamat! Email Anda berhasil diverifikasi. Anda akan segera diarahkan ke halaman login.
          </p>
          {message && (
            <p className="text-green-600 text-sm bg-green-100 border border-green-400 px-3 py-2 rounded-md">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ✅ Tampilan utama (belum verifikasi)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 dark:from-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verifikasi Email Anda
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Kami telah mengirim email verifikasi ke:
          </p>
          <p className="font-semibold text-blue-600 dark:text-blue-400 mt-2">
            {user?.email}
          </p>
        </div>

        <div className="space-y-4">
          {message && (
            <div className="text-green-600 text-sm text-center bg-green-100 border border-green-400 px-3 py-2 rounded-md">
              {message}
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-100 border border-red-400 px-3 py-2 rounded-md flex items-center justify-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Instruksi:
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Cek kotak masuk email Anda</li>
              <li>• Jika tidak ada, periksa folder Spam/Junk</li>
              <li>• Klik link verifikasi di email</li>
              <li>• Kembali ke halaman ini dan klik "Saya Sudah Verifikasi"</li>
            </ul>
          </div>

          <button
            onClick={handleCheckVerification}
            disabled={isChecking}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:opacity-50"
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Memeriksa...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Saya Sudah Verifikasi
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Tidak menerima email?
            </p>
            <button
              onClick={handleResendVerification}
              disabled={resendCooldown > 0}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm transition disabled:opacity-50"
            >
              {resendCooldown > 0
                ? `Kirim Ulang (${resendCooldown}s)`
                : "Kirim Ulang Email Verifikasi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
