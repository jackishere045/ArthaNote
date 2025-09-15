// ArthaNote.jsx - Main Layout dengan proper spacing
import React, { useState } from "react";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";
import Dashboard from "./dashboard/Dashboard";
import SettingsComponent from "./settings/SettingsComponent";
import TransactionList from "./transaction/TransactionList";
import AccountManager from "./account/AccountManager";
import BudgetPage from "./budget/BudgetPage";
import BudgetModal from "./budget/BudgetModal";
import SavingsPage from "./savings/SavingsPage";
import SavingsModal from "./savings/SavingsModal";
import Goals from "./placeholders/Goals";
import Reports from "./placeholders/Reports";
import AddTransaction from "./transaction/AddTransactions";
import AddAccountModal from "./account/AddAccountModal";
import { useTheme } from "../contexts/ThemeContext";

const ArthaNote = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddSavings, setShowAddSavings] = useState(false);
  const { isDark } = useTheme();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "transactions":
        return (
          <TransactionList
            refreshTrigger={showAddTransaction}
            showAdd={showAddTransaction}
            setShowAdd={setShowAddTransaction}
          />
        );
      case "accounts":
        return <AccountManager setShowAddAccount={setShowAddAccount} />;
      case "budget":
        return (
          <BudgetPage
            refreshTrigger={showAddBudget} 
            showAdd={showAddBudget}
            setShowAdd={setShowAddBudget}
          />
        );
      case "savings":
        return (
          <SavingsPage
            refreshTrigger={showAddSavings}
            showAdd={showAddSavings}
            setShowAddSavings={setShowAddSavings}
          />
        );
      case "goals":
        return <Goals />;
      case "reports":
        return <Reports />;
      case "settings":
        return <SettingsComponent />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div
      className={`min-h-screen ${
        isDark ? "dark bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Header */}
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        openAddTransaction={() => setShowAddTransaction(true)}
      />

      {/* Main content area dengan proper spacing */}
      <main 
        className="lg:ml-64 pt-16 min-h-screen"
        style={{ 
          paddingTop: '64px', // Height of header
        }}
      >
        <div className="p-4 lg:p-6 h-full overflow-y-auto">
          {renderContent()}
        </div>
      </main>

      {/* Modals */}
      {showAddTransaction && (
        <AddTransaction
          onClose={() => setShowAddTransaction(false)}
          onTransactionAdded={() => setShowAddTransaction(false)}
        />
      )}

      {showAddAccount && (
        <AddAccountModal
          onClose={() => setShowAddAccount(false)}
          onAccountAdded={() => setShowAddAccount(false)}
        />
      )}

      {showAddBudget && (
        <BudgetModal
          onClose={() => setShowAddBudget(false)}
          onBudgetAdded={() => setShowAddBudget(false)}
        />
      )}

      {showAddSavings && (
        <SavingsModal
          onClose={() => setShowAddSavings(false)}
          onSavingsAdded={() => setShowAddSavings(false)}
        />
      )}
    </div>
  );
};

export default ArthaNote;