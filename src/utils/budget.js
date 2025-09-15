// src/utils/budget.js

/**
 * Calculate spent amount for a specific category and period based on transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {string} category - Category to filter by
 * @param {string} period - Time period (daily, weekly, monthly, yearly)
 * @returns {number} - Total spent amount
 */
export const calculateSpentAmount = (transactions, category, period) => {
  const now = new Date();
  
  // Filter transactions based on category, type, and period
  const filteredTransactions = transactions.filter(transaction => {
    if (transaction.type !== 'expense' || transaction.category !== category) {
      return false;
    }

    const transactionDate = transaction.date?.toDate 
      ? transaction.date.toDate() 
      : new Date(transaction.date);
    
    switch (period) {
      case 'daily':
        return (
          transactionDate.getDate() === now.getDate() &&
          transactionDate.getMonth() === now.getMonth() &&
          transactionDate.getFullYear() === now.getFullYear()
        );
      
      case 'weekly':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return transactionDate >= oneWeekAgo && transactionDate <= now;
      
      case 'monthly':
        return (
          transactionDate.getMonth() === now.getMonth() &&
          transactionDate.getFullYear() === now.getFullYear()
        );
      
      case 'yearly':
        return transactionDate.getFullYear() === now.getFullYear();
      
      default:
        return false;
    }
  });

  return filteredTransactions.reduce((total, transaction) => total + transaction.amount, 0);
};

/**
 * Calculate budget progress percentage
 * @param {number} spent - Amount spent
 * @param {number} budgetAmount - Total budget amount
 * @returns {number} - Progress percentage (0-100+)
 */
export const calculateBudgetProgress = (spent, budgetAmount) => {
  if (budgetAmount === 0) return 0;
  return (spent / budgetAmount) * 100;
};

/**
 * Get budget status based on spending percentage
 * @param {number} spent - Amount spent
 * @param {number} budgetAmount - Total budget amount
 * @returns {object} - Status object with type and color information
 */
export const getBudgetStatus = (spent, budgetAmount) => {
  const percentage = calculateBudgetProgress(spent, budgetAmount);
  
  if (spent > budgetAmount) {
    return {
      type: 'over-budget',
      color: 'red',
      message: 'Over Budget',
      severity: 'high'
    };
  }
  
  if (percentage > 80) {
    return {
      type: 'near-limit',
      color: 'yellow',
      message: 'Near Limit',
      severity: 'medium'
    };
  }
  
  if (percentage > 60) {
    return {
      type: 'on-track-high',
      color: 'orange',
      message: 'On Track',
      severity: 'low'
    };
  }
  
  return {
    type: 'on-track',
    color: 'green',
    message: 'On Track',
    severity: 'none'
  };
};

/**
 * Calculate budget summary statistics
 * @param {Array} budgets - Array of budget objects
 * @param {Array} transactions - Array of transaction objects
 * @returns {object} - Summary statistics
 */
export const calculateBudgetSummary = (budgets, transactions) => {
  const totalAllocated = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  
  let totalSpent = 0;
  let overBudgetCount = 0;
  let nearLimitCount = 0;
  
  budgets.forEach(budget => {
    const spent = calculateSpentAmount(transactions, budget.category, budget.period);
    const status = getBudgetStatus(spent, budget.amount);
    
    totalSpent += spent;
    
    if (status.type === 'over-budget') {
      overBudgetCount++;
    } else if (status.type === 'near-limit') {
      nearLimitCount++;
    }
  });
  
  return {
    totalAllocated,
    totalSpent,
    totalRemaining: totalAllocated - totalSpent,
    overBudgetCount,
    nearLimitCount,
    budgetCount: budgets.length,
    averageUtilization: budgets.length > 0 ? (totalSpent / totalAllocated) * 100 : 0
  };
};

/**
 * Get period label for display
 * @param {string} period - Period key
 * @param {function} t - Translation function
 * @returns {string} - Localized period label
 */
export const getPeriodLabel = (period, t) => {
  const periodMap = {
    'daily': t('daily') || 'Harian',
    'weekly': t('weekly') || 'Mingguan',
    'monthly': t('monthly') || 'Bulanan',
    'yearly': t('yearly') || 'Tahunan'
  };
  return periodMap[period] || period;
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} locale - Locale for formatting (default: 'id-ID')
 * @param {string} currency - Currency code (default: 'IDR')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, locale = 'id-ID', currency = 'IDR') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get budget progress bar color class
 * @param {string} status - Budget status type
 * @param {boolean} isDark - Dark mode flag
 * @returns {object} - Color classes for progress bar
 */
export const getProgressBarColors = (status, isDark) => {
  const colors = {
    'over-budget': {
      bar: 'bg-red-500',
      background: isDark ? 'bg-red-900/20' : 'bg-red-100'
    },
    'near-limit': {
      bar: 'bg-yellow-500',
      background: isDark ? 'bg-yellow-900/20' : 'bg-yellow-100'
    },
    'on-track-high': {
      bar: 'bg-orange-500',
      background: isDark ? 'bg-orange-900/20' : 'bg-orange-100'
    },
    'on-track': {
      bar: 'bg-green-500',
      background: isDark ? 'bg-green-900/20' : 'bg-green-100'
    }
  };
  
  return colors[status] || colors['on-track'];
};

/**
 * Validate budget data
 * @param {object} budgetData - Budget data to validate
 * @returns {object} - Validation result with isValid and errors
 */

export const calculateBudgetUsage = (budget) => {
  const usedAmount = budget.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const percent = budget.amount > 0 ? (usedAmount / budget.amount) * 100 : 0;
  return { usedAmount, percent };
};

export const validateBudgetData = (budgetData) => {
  const errors = [];
  
  if (!budgetData.category || budgetData.category.trim() === '') {
    errors.push('Category is required');
  }
  
  if (!budgetData.amount || budgetData.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (!budgetData.period || budgetData.period.trim() === '') {
    errors.push('Period is required');
  }
  
  const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
  if (budgetData.period && !validPeriods.includes(budgetData.period)) {
    errors.push('Invalid period');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};