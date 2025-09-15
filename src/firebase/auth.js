// src/firebase/auth.js
import { auth, db } from "./config"; // Tambahkan db import
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; // Import Firestore functions

// ✅ Register user (dengan optional nama)
export const registerWithEmail = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Kalau ada name → update displayName
    if (name) {
      await updateProfile(user, { displayName: name });
    }

    // ✅ Buat dokumen Firestore untuk user
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      name: name || "",
      createdAt: serverTimestamp(),
    });

    // ✅ Buat data default untuk user baru
    try {
      console.log("Creating default data for new user...");
      const setupResult = await setupNewUserData();
      if (setupResult.success) {
        console.log("Default data created successfully");
      } else {
        console.warn("Some default data failed to create:", setupResult.error);
      }
    } catch (setupError) {
      console.error("Error creating default data:", setupError);
      // Jangan throw error di sini, karena registrasi sudah berhasil
    }

    // Kirim email verifikasi setelah akun dibuat
    try {
      await sendEmailVerification(user, {
        url: window.location.origin, // URL untuk redirect setelah verifikasi
        handleCodeInApp: false
      });
      console.log("Email verification sent to:", user.email);
    } catch (error) {
      console.error("Error sending email verification:", error);
      // Handle error jika pengiriman email gagal
      throw new Error("Gagal mengirim email verifikasi. Silakan coba lagi nanti.");
    }

    return user;
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle berbagai jenis error
    switch (error.code) {
      case "auth/email-already-in-use":
        throw new Error("Email sudah terdaftar. Silakan gunakan email lain atau login.");
      case "auth/invalid-email":
        throw new Error("Format email tidak valid.");
      case "auth/operation-not-allowed":
        throw new Error("Registrasi email/password tidak diaktifkan.");
      case "auth/weak-password":
        throw new Error("Password terlalu lemah. Gunakan minimal 6 karakter.");
      default:
        if (error.message.includes("email verifikasi")) {
          throw error;
        }
        throw new Error("Gagal mendaftar. Silakan coba lagi.");
    }
  }
};

// ✅ Login user
export const loginWithEmail = async (email, password) => {
  try {
    console.log("loginWithEmail: Starting login process");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("loginWithEmail: SignIn successful", userCredential.user);
    
    // Di sini Anda bisa menambahkan logika untuk memeriksa apakah email sudah diverifikasi
    // Jika belum, Anda bisa throw error atau mengarahkan ke halaman notifikasi.
    if (!userCredential.user.emailVerified) {
      console.log("loginWithEmail: Email not verified, signing out");
      // Hapus sesi login sementara jika email belum diverifikasi
      await signOut(auth); 
      throw new Error("Email Anda belum diverifikasi. Silakan periksa email Anda.");
    }
    
    console.log("loginWithEmail: User logged in successfully and verified");
    return userCredential.user;
  } catch (error) {
    console.error("loginWithEmail: Login error:", error);
    
    // Handle berbagai jenis error
    switch (error.code) {
      case "auth/invalid-email":
        throw new Error("Format email tidak valid.");
      case "auth/user-disabled":
        throw new Error("Akun ini telah dinonaktifkan.");
      case "auth/user-not-found":
        throw new Error("Email tidak terdaftar. Silakan daftar terlebih dahulu.");
      case "auth/wrong-password":
        throw new Error("Password salah. Silakan coba lagi.");
      case "auth/invalid-credential":
        throw new Error("Email atau password salah.");
      case "auth/too-many-requests":
        throw new Error("Terlalu banyak percobaan login. Silakan coba lagi nanti.");
      default:
        // Jika error sudah memiliki pesan (seperti dari pengecekan verifikasi)
        if (error.message.includes("belum diverifikasi")) {
          throw error;
        }
        throw new Error("Gagal login. Silakan periksa email dan password Anda.");
    }
  }
};

// ✅ Logout user
export const logout = async () => {
  await signOut(auth);
};

// Fungsi untuk mengirim ulang email verifikasi
export const resendEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
      return "Email verifikasi berhasil dikirim ulang.";
    } else if (user && user.emailVerified) {
      throw new Error("Email sudah terverifikasi.");
    } else {
      throw new Error("Tidak ada user yang login.");
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    throw new Error("Gagal mengirim ulang email verifikasi.");
  }
};