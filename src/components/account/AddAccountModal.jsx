// src/components/accounts/AddAccountModal.jsx
import React, { useState, useEffect } from "react";
import { addAccount, updateAccount } from "../../firebase/accounts";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Wallet, Landmark, Smartphone, CreditCard } from "lucide-react";

const AddAccountModal = ({ account, onClose, onAccountAdded, isEditing = false }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    type: "bank",
    balance: "",
    accountNumber: "",
    description: "",
    color: "#3B82F6",
    currency: "IDR",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditing && account) {
      setFormData({
        name: account.name || "",
        type: account.type || "bank",
        balance: account.balance?.toString() || "",
        accountNumber: account.accountNumber || "",
        description: account.description || "",
        color: account.color || "#3B82F6",
        currency: account.currency || "IDR",
        isActive: account.isActive !== undefined ? account.isActive : true,
      });
    }
  }, [isEditing, account]);

  const accountTypes = [
    { value: "cash", label: t("cash"), icon: <Wallet className="w-5 h-5" /> },
    { value: "bank", label: t("bank"), icon: <Landmark className="w-5 h-5" /> },
    { value: "eWallet", label: t("eWallet"), icon: <Smartphone className="w-5 h-5" /> },
    { value: "credit", label: t("credit"), icon: <CreditCard className="w-5 h-5" /> },
  ];

  const bankOptions = [
    "BCA", "BRI", "BNI", "Mandiri", "CIMB Niaga", "BTN", "SeaBank",
    "Danamon", "Permata", "OCBC NISP", "Maybank", "Bank Mega", "Lainnya"
  ];

  const eWalletOptions = [
    "GoPay", "OVO", "DANA", "LinkAja", "ShopeePay",
    "Jago", "Jenius", "Lainnya"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.name.trim()) throw new Error(t("nameRequired"));
      if (!formData.balance || isNaN(parseFloat(formData.balance))) throw new Error(t("amountCategoryAccountRequired"));
      if (parseFloat(formData.balance) < 0) throw new Error(t("amountCategoryAccountRequired"));

      const accountData = {
        name: formData.name.trim(),
        type: formData.type,
        balance: parseFloat(formData.balance),
        accountNumber: formData.accountNumber.trim(),
        description: formData.description.trim(),
        color: formData.color,
        currency: formData.currency,
        isActive: formData.isActive,
      };

      let result;
      if (isEditing && account?.id) {
        result = await updateAccount(account.id, accountData);
      } else {
        result = await addAccount(accountData);
      }

      onAccountAdded?.(result);
      window.dispatchEvent?.(new CustomEvent("accountBalanceChanged"));
      alert(isEditing ? t("accountUpdated") : t("accountAdded"));
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className={`w-full max-w-md rounded-xl shadow-lg p-6 ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{isEditing ? t("accountUpdated") : t("addAccountTitle")}</h3>
          <button onClick={onClose} className="text-xl font-bold hover:text-red-500">&times;</button>
        </div>

        {error && (
          <div className={`mb-4 p-2 rounded ${isDark ? "bg-red-900 text-red-300" : "bg-red-100 text-red-700"}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type */}
          <div>
            <label className="block mb-1 font-medium">{t("accountType")} </label>
            <div className="grid grid-cols-2 gap-2">
              {accountTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`flex items-center gap-2 p-2 rounded-lg border transition ${
                    formData.type === type.value
                      ? isDark ? "bg-blue-700 border-blue-400" : "bg-blue-100 border-blue-500"
                      : isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value, accountNumber: "" }))}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Account Name / Bank / E-Wallet */}
          <div>
            <label className="block mb-1 font-medium">
              {formData.type === "cash"
                ? t("cash")
                : formData.type === "bank"
                ? t("bankName")
                : formData.type === "eWallet"
                ? t("eWallet")
                : t("credit")} *
            </label>

            {formData.type === "bank" ? (
              <select
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-gray-900"}`}
                required
              >
                <option value="">{t("selectBank")}</option>
                {bankOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            ) : formData.type === "eWallet" ? (
              <select
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-gray-900"}`}
                required
              >
                <option value="">{t("selectBank")}</option>
                {eWalletOptions.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            ) : (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-gray-900"}`}
                placeholder={t("addAccount")}
                required
              />
            )}
          </div>

          {/* Account Number */}
          {formData.type !== "cash" && (
            <div>
              <label className="block mb-1 font-medium">{t("accountNumber")}</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className={`w-full p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-gray-900"}`}
              />
            </div>
          )}

          {/* Initial Balance */}
          <div>
            <label className="block mb-1 font-medium">{t("initialBalance")} </label>
            <input
              type="number"
              name="balance"
              value={formData.balance}
              onChange={handleInputChange}
              className={`w-full p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-gray-900"}`}
              placeholder="0"
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 font-medium">{t("description")}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full p-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-gray-900"}`}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500 transition">{t("cancel")}</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? t("saving") : t(isEditing ? "accountUpdated" : "accountAdded")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;
