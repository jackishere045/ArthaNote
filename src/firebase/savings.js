// src/firebase/savings.js (Fixed with proper account balance management)
import { db, auth } from "./config";
import { addTransaction } from "./transactions";
import { updateAccountBalance, getAccountById } from "./accounts";
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  where,
  serverTimestamp 
} from "firebase/firestore";

// ✅ Add new savings account
export const addSavings = async (savingsData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Get source account info for display name
    const sourceAccount = await getAccountById(savingsData.sourceAccountId);
    
    const savingsRef = collection(db, "users", user.uid, "savings");
    
    const docData = {
      name: savingsData.name,
      sourceAccountId: savingsData.sourceAccountId, // This is the main storage account
      accountName: sourceAccount.name, // Store account name for display
      targetAmount: savingsData.targetAmount || 0,
      balance: 0, // Always start with 0, then handle initial deposit separately
      notes: savingsData.notes || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(savingsRef, docData);
    const savingsId = docRef.id;

    // If there's an initial balance, handle it as a deposit
    if (savingsData.initialBalance && savingsData.initialBalance > 0) {
      await depositToSavings(
        savingsId, 
        savingsData.initialBalance, 
        savingsData.linkedAccountId || savingsData.sourceAccountId, // Source for initial deposit
        "Initial deposit"
      );
    }

    return { 
      id: savingsId, 
      ...docData, 
      balance: savingsData.initialBalance || 0 
    };
  } catch (error) {
    console.error("Error adding savings:", error);
    throw error;
  }
};

// ✅ Get all savings accounts for current user
export const getUserSavings = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const savingsRef = collection(db, "users", user.uid, "savings");
    const q = query(savingsRef, orderBy("createdAt", "desc"));
    
    const querySnapshot = await getDocs(q);
    const savings = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      // Enrich with account name if not stored
      let accountName = data.accountName;
      if (!accountName && data.sourceAccountId) {
        try {
          const account = await getAccountById(data.sourceAccountId);
          accountName = account.name;
        } catch (error) {
          console.warn("Could not fetch account name for savings:", doc.id);
          accountName = "Unknown Account";
        }
      }
      
      savings.push({
        id: doc.id,
        ...data,
        accountName: accountName
      });
    }

    return savings;
  } catch (error) {
    console.error("Error fetching savings:", error);
    throw error;
  }
};

// ✅ Update savings account
export const updateSavings = async (savingsId, updatedData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const savingsRef = doc(db, "users", user.uid, "savings", savingsId);
    
    // If sourceAccountId is being updated, get the new account name
    let accountName = updatedData.accountName;
    if (updatedData.sourceAccountId && !accountName) {
      const account = await getAccountById(updatedData.sourceAccountId);
      accountName = account.name;
    }

    const updateData = {
      ...updatedData,
      accountName: accountName,
      updatedAt: serverTimestamp()
    };

    await updateDoc(savingsRef, updateData);

    return { id: savingsId, ...updateData };
  } catch (error) {
    console.error("Error updating savings:", error);
    throw error;
  }
};

// ✅ Delete savings account (FIXED)
export const deleteSavings = async (savingsId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Get savings data first
    const savingsRef = doc(db, "users", user.uid, "savings", savingsId);
    const savingsSnap = await getDoc(savingsRef);
    
    if (!savingsSnap.exists()) {
      throw new Error("Savings account not found");
    }

    const savingsData = savingsSnap.data();
    
    // If there's a balance, transfer it back to source account
    if (savingsData.balance > 0) {
      // Add balance back to source account (the storage account already has the money)
      // No need to update storage account balance since it's already there
      // Just record the transaction for audit trail
      await addTransaction({
        type: "savings",
        subType: "delete_transfer",
        amount: savingsData.balance,
        category: "savings_delete",
        account: savingsData.sourceAccountId,
        savingsId: savingsId,
        savingsName: savingsData.name,
        note: `Saldo dikembalikan dari tabungan yang dihapus: ${savingsData.name}`,
        date: new Date()
      });
    }

    // Delete the savings account
    await deleteDoc(savingsRef);

    return savingsId;
  } catch (error) {
    console.error("Error deleting savings:", error);
    throw error;
  }
};

// ✅ Deposit money to savings (FIXED)
export const depositToSavings = async (savingsId, amount, fromAccountId, note = "") => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error("Jumlah deposit harus lebih dari 0");
    }

    // Get current savings data
    const savingsRef = doc(db, "users", user.uid, "savings", savingsId);
    const savingsSnap = await getDoc(savingsRef);
    
    if (!savingsSnap.exists()) {
      throw new Error("Savings account not found");
    }

    const savingsData = savingsSnap.data();
    
    // Check if source account has sufficient balance
    const sourceAccount = await getAccountById(fromAccountId);
    if ((sourceAccount.balance || 0) < amount) {
      throw new Error("Saldo tidak cukup di akun sumber");
    }

    // Update savings balance (add to savings virtual balance)
    const currentSavingsBalance = savingsData.balance || 0;
    const newSavingsBalance = currentSavingsBalance + amount;
    
    await updateDoc(savingsRef, {
      balance: newSavingsBalance,
      updatedAt: serverTimestamp()
    });

    // FIXED: Only update account balances if different accounts
    if (fromAccountId !== savingsData.sourceAccountId) {
      // Update source account balance (subtract from external account)
      await updateAccountBalance(fromAccountId, -amount);
      
      // Update savings storage account balance (add to storage account)
      await updateAccountBalance(savingsData.sourceAccountId, amount);
    }
    // If same account, no physical money movement needed

    // Record transaction
    await addTransaction({
      type: "savings",
      subType: "deposit",
      amount: amount,
      category: "savings_deposit",
      account: fromAccountId,
      savingsId: savingsId,
      savingsName: savingsData.name,
      note: note || `Setor ke ${savingsData.name}`,
      date: new Date()
    });

    return { 
      newBalance: newSavingsBalance, 
      savingsData: { ...savingsData, balance: newSavingsBalance }
    };
  } catch (error) {
    console.error("Error depositing to savings:", error);
    throw error;
  }
};

// ✅ Withdraw money from savings (FIXED)
export const withdrawFromSavings = async (savingsId, amount, toAccountId, note = "") => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error("Jumlah withdraw harus lebih dari 0");
    }

    // Get current savings data
    const savingsRef = doc(db, "users", user.uid, "savings", savingsId);
    const savingsSnap = await getDoc(savingsRef);
    
    if (!savingsSnap.exists()) {
      throw new Error("Savings account not found");
    }

    const savingsData = savingsSnap.data();
    const currentSavingsBalance = savingsData.balance || 0;
    
    if (currentSavingsBalance < amount) {
      throw new Error("Saldo tabungan tidak cukup");
    }

    // Update savings balance (subtract from savings virtual balance)
    const newSavingsBalance = currentSavingsBalance - amount;
    
    await updateDoc(savingsRef, {
      balance: newSavingsBalance,
      updatedAt: serverTimestamp()
    });

    // FIXED: Only update account balances if different accounts
    if (toAccountId !== savingsData.sourceAccountId) {
      // Update savings storage account balance (subtract from storage account)
      await updateAccountBalance(savingsData.sourceAccountId, -amount);
      
      // Update destination account balance (add to destination account)
      await updateAccountBalance(toAccountId, amount);
    }
    // If same account, no physical money movement needed

    // Record transaction
    await addTransaction({
      type: "savings",
      subType: "withdraw",
      amount: amount,
      category: "savings_withdraw",
      account: toAccountId,
      savingsId: savingsId,
      savingsName: savingsData.name,
      note: note || `Tarik dari ${savingsData.name}`,
      date: new Date()
    });

    return { 
      newBalance: newSavingsBalance, 
      savingsData: { ...savingsData, balance: newSavingsBalance }
    };
  } catch (error) {
    console.error("Error withdrawing from savings:", error);
    throw error;
  }
};

// ✅ Get savings transactions for analysis
export const getSavingsTransactions = async (savingsId = null) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const transactionsRef = collection(db, "users", user.uid, "transactions");
    
    // Get all transactions first, then filter in memory to avoid index requirements
    const q = query(transactionsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const transactions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter for savings transactions
      if (data.type === "savings") {
        // If savingsId specified, filter by that too
        if (!savingsId || data.savingsId === savingsId) {
          transactions.push({
            id: doc.id,
            ...data
          });
        }
      }
    });

    return transactions;
  } catch (error) {
    console.error("Error fetching savings transactions:", error);
    throw error;
  }
};

// ✅ Get savings summary
export const getSavingsSummary = async () => {
  try {
    const savings = await getUserSavings();
    const totalBalance = savings.reduce((sum, saving) => sum + (saving.balance || 0), 0);
    
    // Get this month's savings transactions for growth calculation
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const allTransactions = await getSavingsTransactions();
    const thisMonthTransactions = allTransactions.filter(transaction => {
      const transactionDate = transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date);
      return transactionDate >= startOfMonth;
    });
    
    const monthlyDeposits = thisMonthTransactions
      .filter(t => t.subType === "deposit")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyWithdrawals = thisMonthTransactions
      .filter(t => t.subType === "withdraw")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyGrowth = monthlyDeposits - monthlyWithdrawals;
    
    return {
      totalBalance,
      totalAccounts: savings.length,
      monthlyGrowth,
      monthlyDeposits,
      monthlyWithdrawals,
      savings
    };
  } catch (error) {
    console.error("Error calculating savings summary:", error);
    throw error;
  }
};