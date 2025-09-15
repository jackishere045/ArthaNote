// src/firebase/createDefaultData.js
import { addAccount } from './accounts';
import { addCategory } from './categories';

// ✅ Buat akun default saat user baru daftar
export const createDefaultAccounts = async () => {
  try {
    const defaultAccounts = [
      {
        name: 'Kas',
        type: 'cash',
        balance: 0,
        currency: 'IDR',
        description: 'Uang tunai',
        isActive: true
      },
      {
        name: 'Bank Utama',
        type: 'bank',
        balance: 0,
        currency: 'IDR', 
        description: 'Rekening bank utama',
        isActive: true
      }
    ];

    const createdAccounts = [];
    for (const account of defaultAccounts) {
      const result = await addAccount(account);
      createdAccounts.push(result);
    }

    console.log('Default accounts created:', createdAccounts);
    return createdAccounts;
  } catch (error) {
    console.error('Error creating default accounts:', error);
    throw error;
  }
};

// ✅ Buat kategori default saat user baru daftar
export const createDefaultCategories = async () => {
  try {
    const defaultCategories = [
      // Expense categories
      { name: 'Makanan & Minuman', type: 'expense', icon: '🍽️', color: '#EF4444' },
      { name: 'Transportasi', type: 'expense', icon: '🚗', color: '#3B82F6' },
      { name: 'Belanja', type: 'expense', icon: '🛍️', color: '#8B5CF6' },
      { name: 'Hiburan', type: 'expense', icon: '🎬', color: '#F59E0B' },
      { name: 'Kesehatan', type: 'expense', icon: '⚕️', color: '#10B981' },
      { name: 'Pendidikan', type: 'expense', icon: '📚', color: '#06B6D4' },
      { name: 'Utilitas', type: 'expense', icon: '💡', color: '#F97316' },
      
      // Income categories
      { name: 'Gaji', type: 'income', icon: '💼', color: '#22C55E' },
      { name: 'Bonus', type: 'income', icon: '🎁', color: '#A855F7' },
      { name: 'Freelance', type: 'income', icon: '💻', color: '#3B82F6' },
      { name: 'Investasi', type: 'income', icon: '📈', color: '#059669' },
      { name: 'Bisnis', type: 'income', icon: '🏢', color: '#DC2626' }
    ];

    const createdCategories = [];
    for (const category of defaultCategories) {
      const result = await addCategory(category);
      createdCategories.push(result);
    }

    console.log('Default categories created:', createdCategories);
    return createdCategories;
  } catch (error) {
    console.error('Error creating default categories:', error);
    throw error;
  }
};

// ✅ Setup data lengkap untuk user baru
export const setupNewUserData = async () => {
  try {
    console.log('Setting up default data for new user...');
    
    const [accounts, categories] = await Promise.all([
      createDefaultAccounts(),
      createDefaultCategories()
    ]);

    return {
      accounts,
      categories,
      success: true
    };
  } catch (error) {
    console.error('Error setting up new user data:', error);
    return {
      accounts: [],
      categories: [],
      success: false,
      error: error.message
    };
  }
};