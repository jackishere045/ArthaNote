// src/components/AuthForm.jsx
import React, { useState } from "react";
import { loginWithEmail, registerWithEmail } from "../firebase/auth";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";

const AuthForm = () => {
  const { user } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Jangan render kalau user sudah login (App.jsx yang handle)
  if (user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (isRegister) {
        await registerWithEmail(email, password, name);

        setMessage("Registrasi berhasil! Silakan cek email (juga folder spam) untuk verifikasi sebelum login.");
        setIsRegister(false);
        setEmail("");
        setPassword("");
        setName("");
      } else {
        const loggedInUser = await loginWithEmail(email, password);

        if (!loggedInUser.emailVerified) {
          await signOut(auth);
          throw new Error("Email Anda belum diverifikasi. Silakan cek email Anda.");
        }

        setMessage("Login berhasil!");
        // App.jsx akan render <ArthaNote />
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 dark:from-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-extrabold text-center mb-6 text-gray-900 dark:text-white">
            {isRegister ? "Create Your Account" : "Welcome Back!"}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
            {isRegister ? "Join our community today." : "Log in to continue to your dashboard."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-red-500 text-sm text-center bg-red-100 border border-red-400 px-3 py-2 rounded-md">
                {error}
              </p>
            )}
            {message && (
              <p className="text-green-600 text-sm text-center bg-green-100 border border-green-400 px-3 py-2 rounded-md">
                {message}
              </p>
            )}

            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              {isRegister ? "Sign Up" : "Log In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <span
                className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? "Log in" : "Sign up"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
