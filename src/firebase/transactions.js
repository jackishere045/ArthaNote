// src/firebase/transactions.js (Fixed to avoid double balance updates for savings)
import { db, auth } from "./config";
import { adjustAccountBalance } from "./accounts";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  query, 
  orderBy, 
  where,
  limit,
  serverTimestamp 
} from "firebase/firestore";


// ✅ Add new transaction (FIXED to avoid double updates for savings)
export const addTransaction = async (transactionData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const transactionsRef = collection(db, "users", user.uid, "transactions");

    const docRef = await addDoc(transactionsRef, {
      ...transactionData,
      date: transactionData.date || serverTimestamp(),
      createdAt: serverTimestamp()
    });

    // ✅ FIXED: Only update account balance for non-savings transactions
    // Savings transactions handle their own balance updates
    if (transactionData.type !== "savings" && transactionData.account && transactionData.amount) {
      await adjustAccountBalance(
        transactionData.account,
        transactionData.amount,
        transactionData.type
      );
    }

    return { id: docRef.id, ...transactionData };
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw error;
  }
};

// ✅ Get all transactions for current user
export const getUserTransactions = async (limitCount = 50) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const transactionsRef = collection(db, "users", user.uid, "transactions");
    const q = query(
      transactionsRef,
      orderBy("createdAt", "desc"), // Gunakan createdAt untuk order yang konsisten
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const transactions = [];
    
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

// ✅ Get transactions by type (income/expense) - FIXED
export const getTransactionsByType = async (type) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const transactionsRef = collection(db, "users", user.uid, "transactions");
    const q = query(
      transactionsRef,
      where("type", "==", type), // Fixed: gunakan transactionsRef dan field type
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const transactions = [];
    
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return transactions;
  } catch (error) {
    console.error("Error fetching transactions by type:", error);
    throw error;
  }
};

// ✅ Update transaction (FIXED to handle savings transactions properly)
export const updateTransaction = async (transactionId, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const transactionRef = doc(db, "users", user.uid, "transactions", transactionId);
    
    // Get original transaction data
    const originalDoc = await getDoc(transactionRef);
    if (!originalDoc.exists()) {
      throw new Error("Transaction not found");
    }
    
    const originalData = originalDoc.data();
    
    // Update the transaction
    await updateDoc(transactionRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });

    // ✅ FIXED: Only handle balance adjustments for non-savings transactions
    if (originalData.type !== "savings" && originalData.account && originalData.amount) {
      // Reverse the original transaction effect
      const reverseType = originalData.type === "income" ? "expense" : "income";
      await adjustAccountBalance(
        originalData.account,
        originalData.amount,
        reverseType
      );
      
      // Apply the new transaction effect (if it's still not a savings transaction)
      if (updatedData.type !== "savings" && updatedData.account && updatedData.amount) {
        await adjustAccountBalance(
          updatedData.account,
          updatedData.amount,
          updatedData.type
        );
      }
    }

    return { id: transactionId, ...updatedData };
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

// ✅ Delete transaction (FIXED to handle savings transactions properly)
export const deleteTransaction = async (transactionId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const transactionRef = doc(db, "users", user.uid, "transactions", transactionId);
    const transactionDoc = await getDoc(transactionRef);

    if (!transactionDoc.exists()) {
      throw new Error("Transaction not found");
    }

    const transactionData = transactionDoc.data();

    // Hapus transaksi
    await deleteDoc(transactionRef);

    // ✅ FIXED: Only reverse account balance for non-savings transactions
    // Savings transactions are managed by the savings module
    if (transactionData.type !== "savings" && transactionData.account && transactionData.amount) {
      const reverseType = transactionData.type === "income" ? "expense" : "income";
      await adjustAccountBalance(
        transactionData.account,
        transactionData.amount,
        reverseType
      );
    }

    return transactionId;
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};


// ✅ Get transactions summary (total income & expense) - FIXED to exclude savings internal transactions
export const getTransactionsSummary = async () => {
  try {
    const transactions = await getUserTransactions(1000); // Get more for accurate summary
    
    const summary = transactions.reduce((acc, transaction) => {
      // Only count actual income/expense, not internal savings movements
      if (transaction.type === "income") {
        acc.totalIncome += transaction.amount;
      } else if (transaction.type === "expense") {
        acc.totalExpense += transaction.amount;
      }
      // Skip savings transactions as they are internal transfers
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });

    summary.balance = summary.totalIncome - summary.totalExpense;
    
    return summary;
  } catch (error) {
    console.error("Error calculating summary:", error);
    throw error;
  }
};