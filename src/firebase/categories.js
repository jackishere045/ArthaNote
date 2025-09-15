// src/firebase/categories.js
import { db, auth } from "./config";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  where,
  serverTimestamp 
} from "firebase/firestore";

// ✅ Add new category
export const addCategory = async (categoryData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Reference ke subcollection categories
    const categoriesRef = collection(db, "users", user.uid, "categories");
    
    const docRef = await addDoc(categoriesRef, {
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { id: docRef.id, ...categoryData };
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

// ✅ Get all categories for current user
export const getUserCategories = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const categoriesRef = collection(db, "users", user.uid, "categories");
    const q = query(categoriesRef, orderBy("createdAt", "asc"));
    
    const querySnapshot = await getDocs(q);
    const categories = [];
    
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

// ✅ Get categories by type (income/expense)
export const getCategoriesByType = async (type) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const categoriesRef = collection(db, "users", user.uid, "categories");
    const q = query(
      categoriesRef,
      where("type", "==", type),
      orderBy("createdAt", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const categories = [];
    
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return categories;
  } catch (error) {
    console.error("Error fetching categories by type:", error);
    throw error;
  }
};

// ✅ Update category
export const updateCategory = async (categoryId, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const categoryRef = doc(db, "users", user.uid, "categories", categoryId);
    
    await updateDoc(categoryRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });

    return { id: categoryId, ...updatedData };
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

// ✅ Delete category
export const deleteCategory = async (categoryId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const categoryRef = doc(db, "users", user.uid, "categories", categoryId);
    await deleteDoc(categoryRef);

    return categoryId;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};