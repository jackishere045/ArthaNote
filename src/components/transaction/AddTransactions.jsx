// src/components/transactions/AddTransaction.jsx
import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { addTransaction } from '../../firebase/transactions';
import { getUserAccounts } from '../../firebase/accounts';
import { getUserCategories, addCategory } from '../../firebase/categories';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  slugifyCategoryName,
  getCategoryOptions,
  formatCategoryName,
} from "../../utils/categories";
import './transaction.css';

const AddTransaction = ({ onTransactionAdded, onClose }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    type: 'expense',
    note: '',
    account: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [userCategories, setUserCategories] = useState([]); // simpan user categories
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    loadAccountsAndCategories();
  }, []);

  const loadAccountsAndCategories = async () => {
    try {
      setLoadingAccounts(true);
      const accountsData = await getUserAccounts();
      setAccounts(accountsData);
      if (accountsData.length > 0 && !formData.account) {
        const cashAccount = accountsData.find(acc => acc.type === 'cash');
        const defaultAccount = cashAccount || accountsData[0];
        setFormData(prev => ({ ...prev, account: defaultAccount.id }));
      }

      setLoadingCategories(true);
      const userCategoriesData = await getUserCategories();
      setUserCategories(userCategoriesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(t('failedAddCategory'));
    } finally {
      setLoadingAccounts(false);
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({ ...prev, type, category: '' }));
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return alert(t('nameRequired'));

    const key = slugifyCategoryName(newCategory.trim());
    if (userCategories.some(cat => cat.key === key && cat.type === formData.type)) {
      return alert(t('categoryExists'));
    }

    try {
      await addCategory({
        key,
        name: newCategory.trim(), // nama original user
        type: formData.type,
        icon: '📝',
        color: '#6B7280'
      });

      const newCatObj = { key, name: newCategory.trim(), type: formData.type };
      setUserCategories(prev => [...prev, newCatObj]);
      setFormData(prev => ({ ...prev, category: key }));
      setNewCategory('');
      setShowAddCategory(false);
    } catch (err) {
      console.error(err);
      alert(t('failedAddCategory'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (!formData.amount || !formData.category || !formData.account) {
        throw new Error(t('amountCategoryAccountRequired'));
      }

      const selectedAccount = accounts.find(acc => acc.id === formData.account);
      if (!selectedAccount) throw new Error(t('accountNotFound'));

      const amount = parseFloat(formData.amount);

      // ✅ Tambahkan pengecekan saldo untuk expense
      if (formData.type === 'expense' && selectedAccount.balance < amount) {
        toast.error(t('insufficientBalance') || 'Saldo tidak cukup!');
        setLoading(false);
        return;
      }

      const transactionData = {
        ...formData,
        amount,
        accountName: selectedAccount.name,
        accountType: selectedAccount.type,
        date: new Date()
      };

      const result = await addTransaction(transactionData);

      setFormData({
        amount: '',
        category: '',
        type: 'expense',
        note: '',
        account: accounts[0]?.id || ''
      });

      if (onTransactionAdded) onTransactionAdded(result);
      alert(t('transactionAdded'));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const getAccountLabel = (account) => {
    const typeLabel = account.type === 'cash' ? t('cash') :
                      account.type === 'bank' ? t('bank') :
                      account.type === 'eWallet' ? t('eWallet') : t('credit');
    return `${account.name} (${typeLabel})`;
  };

  return (
    <div className={`add-transaction-overlay ${isDark ? 'dark' : ''}`}>
      <Toaster position="top-right" />

      <div className={`add-transaction-modal bg-white dark:bg-gray-800`}>
        <div className="modal-header border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-white">{t('addTransactionTitle')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="transaction-form">
          {error && <div className="error-message">{error}</div>}

          {/* Type */}
          <div className="form-group">
            <label className="text-gray-700 dark:text-gray-300">{t('transactionType')}</label>
            <div className="type-selector">
              <button type="button"
                className={`type-btn ${formData.type==='expense'?'active expense':''}`}
                onClick={()=>handleTypeChange('expense')}>
                {t('expense')}
              </button>
              <button type="button"
                className={`type-btn ${formData.type==='income'?'active income':''}`}
                onClick={()=>handleTypeChange('income')}>
                {t('income')}
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label htmlFor="amount" className="text-gray-700 dark:text-gray-300">{t('amount')} *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder={t('enterAmount')}
              min="0"
              step="0.01"
              required
              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
            />
          </div>

          {/* Account */}
          <div className="form-group">
            <label htmlFor="account" className="text-gray-700 dark:text-gray-300">{t('account')} *</label>
            {loadingAccounts ? (
              <div className="loading-select">{t('loadingAccounts')}</div>
            ) : accounts.length===0 ? (
              <div className="no-accounts">
                <p>{t('noAccounts')}</p>
                <small>{t('addAccountFirst')}</small>
              </div>
            ) : (
              <select
                id="account"
                name="account"
                value={formData.account}
                onChange={handleInputChange}
                required
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
              >
                <option value="">{t('selectAccount')}</option>
                {accounts.map(acc=><option key={acc.id} value={acc.id}>{getAccountLabel(acc)}</option>)}
              </select>
            )}
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category" className="text-gray-700 dark:text-gray-300">{t('category')} *</label>
            <div className="category-input-group">
              {loadingCategories ? (
                <div className="loading-select">{t('loadingCategories')}</div>
              ) : (
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 flex-1"
                >
                  <option value="">{t('selectCategory')}</option>
                  {getCategoryOptions(formData.type, t, userCategories).map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              <button type="button" className="add-category-btn" onClick={()=>setShowAddCategory(true)}>+</button>
            </div>
          </div>

          {/* Add Category Modal */}
          {showAddCategory && (
            <div className="add-category-modal">
              <div className="add-category-content bg-white dark:bg-gray-700">
                <h4 className="text-gray-900 dark:text-white">
                  {t('addCategoryTitle')} {formData.type==='expense'?t('expense'):t('income')}
                </h4>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e)=>setNewCategory(e.target.value)}
                  placeholder={t('addCategoryPlaceholder')}
                  onKeyPress={e=>e.key==='Enter'&&handleAddCategory()}
                  className="bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                />
                <div className="add-category-actions">
                  <button type="button" onClick={()=>{setShowAddCategory(false); setNewCategory('');}}>
                    {t('cancel')}
                  </button>
                  <button type="button" onClick={handleAddCategory}>{t('addCategory')}</button>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="form-group">
            <label htmlFor="note" className="text-gray-700 dark:text-gray-300">{t('note')}</label>
            <textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              placeholder={t('optionalNote')}
              rows={3}
              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className={`submit-btn ${formData.type}`} disabled={loading||loadingAccounts||accounts.length===0}>
              {loading ? t('saving') : t('saveTransaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;
