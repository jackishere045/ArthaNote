// src/components/savings/SavingsModal.jsx (Fixed with better validation)
import React, { useState, useEffect } from 'react';
import { X, PiggyBank, Plus, Minus, Edit, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getUserAccounts } from '../../firebase/accounts';
import { 
  addSavings, 
  updateSavings, 
  depositToSavings, 
  withdrawFromSavings, 
  deleteSavings 
} from '../../firebase/savings';

const SavingsModal = ({ 
  mode = 'create', // 'create', 'edit', 'deposit', 'withdraw', 'delete'
  savings = null, 
  onClose, 
  onSuccess 
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sourceAccountId: '', // Main storage account (where savings are kept)
    linkedAccountId: '', // For initial deposit source
    targetAmount: '',
    initialBalance: '',
    notes: '',
    // For deposit/withdraw
    amount: '',
    accountId: '', // External account for deposits/withdrawals
    note: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadAccounts();
    if (savings && (mode === 'edit' || mode === 'deposit' || mode === 'withdraw')) {
      setFormData(prev => ({
        ...prev,
        name: savings.name || '',
        sourceAccountId: savings.sourceAccountId || '',
        linkedAccountId: savings.sourceAccountId || '', // For backward compatibility
        targetAmount: savings.targetAmount || '',
        initialBalance: savings.balance || '',
        notes: savings.notes || '',
        accountId: '' // Reset for deposit/withdraw operations
      }));
    }
  }, [savings, mode]);

  const loadAccounts = async () => {
    try {
      const accountsData = await getUserAccounts();
      setAccounts(accountsData);
      
      if (accountsData.length > 0 && !formData.sourceAccountId && mode === 'create') {
        const cashAccount = accountsData.find(acc => acc.type === 'cash');
        const defaultAccount = cashAccount || accountsData[0];
        setFormData(prev => ({ 
          ...prev, 
          sourceAccountId: defaultAccount.id,
          linkedAccountId: defaultAccount.id
        }));
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError(t('failedToLoadAccounts') || 'Gagal memuat akun');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // FIXED: Better validation functions
  const validateCreateForm = () => {
    if (!formData.name.trim()) {
      throw new Error(t('nameRequired') || 'Nama tabungan harus diisi');
    }

    if (!formData.sourceAccountId) {
      throw new Error(t('selectSourceAccount') || 'Pilih akun penyimpanan');
    }

    const initialBalance = parseFloat(formData.initialBalance) || 0;
    if (initialBalance > 0) {
      const sourceAccountId = formData.linkedAccountId || formData.sourceAccountId;
      const sourceAccount = accounts.find(acc => acc.id === sourceAccountId);
      
      if (!sourceAccount || sourceAccount.balance < initialBalance) {
        throw new Error(`Saldo tidak cukup di akun ${sourceAccount?.name || 'yang dipilih'}. Saldo tersedia: ${formatCurrency(sourceAccount?.balance || 0)}`);
      }
    }
  };

  const validateDepositForm = () => {
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      throw new Error(t('invalidAmount') || 'Jumlah tidak valid');
    }

    if (!formData.accountId) {
      throw new Error(t('selectAccount') || 'Pilih akun sumber');
    }

    const sourceAccount = accounts.find(acc => acc.id === formData.accountId);
    if (!sourceAccount || sourceAccount.balance < amount) {
      throw new Error(`Saldo tidak cukup di akun ${sourceAccount?.name || 'yang dipilih'}. Saldo tersedia: ${formatCurrency(sourceAccount?.balance || 0)}`);
    }
  };

  const validateWithdrawForm = () => {
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      throw new Error(t('invalidAmount') || 'Jumlah tidak valid');
    }

    if (!formData.accountId) {
      throw new Error(t('selectAccount') || 'Pilih akun tujuan');
    }

    if (savings.balance < amount) {
      throw new Error(`Saldo tabungan tidak cukup. Saldo tersedia: ${formatCurrency(savings.balance)}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'create') {
        validateCreateForm();
        await handleCreateSavings();
      } else if (mode === 'edit') {
        await handleEditSavings();
      } else if (mode === 'deposit') {
        validateDepositForm();
        await handleDeposit();
      } else if (mode === 'withdraw') {
        validateWithdrawForm();
        await handleWithdraw();
      } else if (mode === 'delete') {
        await handleDelete();
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSavings = async () => {
    // For initial deposit, use linkedAccountId if provided, otherwise sourceAccountId
    const initialDepositSource = formData.linkedAccountId || formData.sourceAccountId;

    const savingsData = {
      name: formData.name.trim(),
      sourceAccountId: formData.sourceAccountId, // Main storage account
      linkedAccountId: initialDepositSource, // Source for initial deposit
      targetAmount: parseFloat(formData.targetAmount) || 0,
      initialBalance: parseFloat(formData.initialBalance) || 0,
      notes: formData.notes.trim()
    };

    await addSavings(savingsData);
    onSuccess?.();
    onClose();
  };

  const handleEditSavings = async () => {
    if (!formData.name.trim()) {
      throw new Error(t('nameRequired') || 'Nama tabungan harus diisi');
    }

    if (!formData.sourceAccountId) {
      throw new Error(t('selectSourceAccount') || 'Pilih akun penyimpanan');
    }

    const updatedData = {
      name: formData.name.trim(),
      sourceAccountId: formData.sourceAccountId,
      targetAmount: parseFloat(formData.targetAmount) || 0,
      notes: formData.notes.trim()
    };

    await updateSavings(savings.id, updatedData);
    onSuccess?.();
    onClose();
  };

  const handleDeposit = async () => {
    const amount = parseFloat(formData.amount);
    await depositToSavings(
      savings.id, 
      amount, 
      formData.accountId, // External source account
      formData.note
    );
    
    onSuccess?.();
    onClose();
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(formData.amount);
    await withdrawFromSavings(
      savings.id, 
      amount, 
      formData.accountId, // External destination account
      formData.note
    );
    
    onSuccess?.();
    onClose();
  };

  const handleDelete = async () => {
    await deleteSavings(savings.id);
    onSuccess?.();
    onClose();
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return t('addSavings') || 'Tambah Tabungan';
      case 'edit': return t('editSavings') || 'Edit Tabungan';
      case 'deposit': return t('depositToSavings') || 'Setor ke Tabungan';
      case 'withdraw': return t('withdrawFromSavings') || 'Tarik dari Tabungan';
      case 'delete': return t('deleteSavings') || 'Hapus Tabungan';
      default: return '';
    }
  };

  const getAccountLabel = (account) => {
    const typeLabel = account.type === 'cash' ? t('cash') :
                      account.type === 'bank' ? t('bank') :
                      account.type === 'eWallet' ? t('eWallet') : t('credit');
    return `${account.name} (${typeLabel}) - ${formatCurrency(account.balance || 0)}`;
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  // Filter accounts for different purposes
  const getAvailableAccounts = (purpose = 'all') => {
    if (purpose === 'deposit_source') {
      // For deposits, show all accounts except the savings storage account
      return accounts.filter(acc => acc.id !== savings?.sourceAccountId);
    }
    if (purpose === 'withdraw_destination') {
      // For withdrawals, show all accounts
      return accounts;
    }
    // For storage accounts (create/edit), show all accounts
    return accounts;
  };

  // FIXED: Get available balance for selected account
  const getSelectedAccountBalance = () => {
    const selectedAccount = accounts.find(acc => acc.id === formData.accountId);
    return selectedAccount?.balance || 0;
  };

  // FIXED: Get available balance for initial deposit source
  const getInitialDepositSourceBalance = () => {
    const sourceId = formData.linkedAccountId || formData.sourceAccountId;
    const sourceAccount = accounts.find(acc => acc.id === sourceId);
    return sourceAccount?.balance || 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-lg rounded-xl shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'} max-h-screen overflow-y-auto`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                {mode === 'deposit' ? <Plus className="w-5 h-5" /> :
                 mode === 'withdraw' ? <Minus className="w-5 h-5" /> :
                 mode === 'edit' ? <Edit className="w-5 h-5" /> :
                 mode === 'delete' ? <Trash2 className="w-5 h-5" /> :
                 <PiggyBank className="w-5 h-5" />}
              </div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {getModalTitle()}
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {mode === 'delete' ? (
            <div className="text-center py-4">
              <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
                <p>{t('confirmDeleteSavings') || 'Apakah Anda yakin ingin menghapus tabungan ini?'}</p>
                <p className="mt-2 font-semibold">{savings?.name}</p>
                <p className="text-sm mt-1">
                  {t('currentBalance')}: {formatCurrency(savings?.balance || 0)}
                </p>
                {savings?.balance > 0 && (
                  <p className="text-sm mt-2 font-medium">
                    {t('balanceWillBeTransferred') || 'Saldo akan tetap berada di akun penyimpanan'}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('deleteSavingsWarning') || 'Tindakan ini tidak dapat dibatalkan.'}
              </p>
            </div>
          ) : (
            <>
              {(mode === 'create' || mode === 'edit') && (
                <>
                  {/* Savings Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('savingsName') || 'Nama Tabungan'} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={t('enterSavingsName') || 'Masukkan nama tabungan'}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      required
                    />
                  </div>

                  {/* Storage Account */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('storageAccount') || 'Akun Penyimpanan'} *
                    </label>
                    <select
                      name="sourceAccountId"
                      value={formData.sourceAccountId}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      required
                    >
                      <option value="">{t('selectStorageAccount') || 'Pilih Akun Penyimpanan'}</option>
                      {getAvailableAccounts('storage').map(account => (
                        <option key={account.id} value={account.id}>
                          {getAccountLabel(account)}
                        </option>
                      ))}
                    </select>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t('storageAccountDesc') || 'Akun tempat saldo tabungan akan disimpan secara fisik'}
                    </p>
                  </div>

                  {/* Initial Deposit Source (only for create) */}
                  {mode === 'create' && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('initialDepositSource') || 'Sumber Setoran Awal'} ({t('optional') || 'Opsional'})
                      </label>
                      <select
                        name="linkedAccountId"
                        value={formData.linkedAccountId}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="">{t('selectAccount') || 'Pilih Akun'}</option>
                        {accounts.map(account => (
                          <option key={account.id} value={account.id}>
                            {getAccountLabel(account)}
                          </option>
                        ))}
                      </select>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('initialDepositDesc') || 'Akun sumber untuk setoran awal (jika berbeda dari akun penyimpanan)'}
                      </p>
                      {/* Show available balance */}
                      {(formData.linkedAccountId || formData.sourceAccountId) && (
                        <p className={`text-xs mt-1 font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          Saldo tersedia: {formatCurrency(getInitialDepositSourceBalance())}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Target Amount */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('targetAmount') || 'Target Jumlah'} ({t('optional') || 'Opsional'})
                    </label>
                    <input
                      type="number"
                      name="targetAmount"
                      value={formData.targetAmount}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="1000"
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>

                  {/* Initial Balance (only for create) */}
                  {mode === 'create' && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('initialBalance') || 'Saldo Awal'} ({t('optional') || 'Opsional'})
                      </label>
                      <input
                        type="number"
                        name="initialBalance"
                        value={formData.initialBalance}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        step="1000"
                        max={getInitialDepositSourceBalance()}
                        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('initialBalanceDesc') || 'Akan dipindahkan dari akun sumber setoran awal'}
                      </p>
                      {/* Balance warning */}
                      {parseFloat(formData.initialBalance) > getInitialDepositSourceBalance() && (
                        <p className="text-xs mt-1 text-red-500">
                          Saldo tidak cukup! Maksimal: {formatCurrency(getInitialDepositSourceBalance())}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('notes') || 'Catatan'} ({t('optional') || 'Opsional'})
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder={t('enterNotes') || 'Masukkan catatan'}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                </>
              )}

              {(mode === 'deposit' || mode === 'withdraw') && (
                <>
                  {/* Current Balance Info */}
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t('currentSavingsBalance') || 'Saldo Tabungan Saat Ini'}:
                      </span>
                      <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        {formatCurrency(savings?.balance || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('storageAccount') || 'Akun Penyimpanan'}:
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {savings?.accountName}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('amount') || 'Jumlah'} *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder={t('enterAmount') || 'Masukkan jumlah'}
                      min="1000"
                      step="1000"
                      max={mode === 'deposit' ? getSelectedAccountBalance() : (savings?.balance || 0)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      required
                    />
                    {/* Amount validation warning */}
                    {mode === 'deposit' && parseFloat(formData.amount) > getSelectedAccountBalance() && (
                      <p className="text-xs mt-1 text-red-500">
                        Saldo tidak cukup! Maksimal: {formatCurrency(getSelectedAccountBalance())}
                      </p>
                    )}
                    {mode === 'withdraw' && parseFloat(formData.amount) > (savings?.balance || 0) && (
                      <p className="text-xs mt-1 text-red-500">
                        Saldo tabungan tidak cukup! Maksimal: {formatCurrency(savings?.balance || 0)}
                      </p>
                    )}
                  </div>

                  {/* Account Selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {mode === 'deposit' 
                        ? (t('fromAccount') || 'Dari Akun') 
                        : (t('toAccount') || 'Ke Akun')
                      } *
                    </label>
                    <select
                      name="accountId"
                      value={formData.accountId}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      required
                    >
                      <option value="">{t('selectAccount') || 'Pilih Akun'}</option>
                      {getAvailableAccounts(mode === 'deposit' ? 'deposit_source' : 'withdraw_destination').map(account => (
                        <option key={account.id} value={account.id}>
                          {getAccountLabel(account)}
                        </option>
                      ))}
                    </select>
                    {mode === 'deposit' && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('depositAccountDesc') || 'Dana akan dipindahkan dari akun ini ke tabungan'}
                      </p>
                    )}
                    {mode === 'withdraw' && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('withdrawAccountDesc') || 'Dana akan dipindahkan dari tabungan ke akun ini'}
                      </p>
                    )}
                    {/* Show selected account balance */}
                    {formData.accountId && (
                      <p className={`text-xs mt-1 font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        Saldo tersedia: {formatCurrency(getSelectedAccountBalance())}
                      </p>
                    )}
                  </div>

                  {/* Note */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('note') || 'Catatan'} ({t('optional') || 'Opsional'})
                    </label>
                    <input
                      type="text"
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      placeholder={t('optionalNote') || 'Catatan opsional'}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} transition-colors`}
            >
              {t('cancel') || 'Batal'}
            </button>
            <button
              type="submit"
              disabled={loading || (accounts.length === 0 && (mode === 'create' || mode === 'edit'))}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                mode === 'delete' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('processing') || 'Memproses...'}
                </div>
              ) : (
                <>
                  {mode === 'create' && (t('createSavings') || 'Buat Tabungan')}
                  {mode === 'edit' && (t('updateSavings') || 'Perbarui Tabungan')}
                  {mode === 'deposit' && (t('deposit') || 'Setor')}
                  {mode === 'withdraw' && (t('withdraw') || 'Tarik')}
                  {mode === 'delete' && (t('delete') || 'Hapus')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SavingsModal;