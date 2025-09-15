// src/utils/categories.js
export const defaultCategories = {
  expense: [
    "food",
    "transport",
    "shopping",
    "entertainment",
    "health",
    "education",
    "utilities",
    "investments",
    "donations",
    "travel",
    "others",
    "savings_withdraw"
  ],
  income: [
    "salary",
    "bonus",
    "freelance",
    "investments",
    "business",
    "gifts",
    "dividends",
    "others",
    "savings_deposit"
  ],
};

export const slugifyCategoryName = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

// Get category label with translation support
export const getCategoryLabel = (key, type, t, fallbackName = "") => {
  // First try to get from translation object based on type
  const translationKey = type === "expense" ? "defaultExpenseCategories" : "defaultIncomeCategories";
  
  // Access the nested translation object
  const categoryTranslations = t(translationKey);
  
  // Check if categoryTranslations is an object and has the key
  if (categoryTranslations && typeof categoryTranslations === 'object' && categoryTranslations[key]) {
    return categoryTranslations[key];
  }
  
  // Otherwise return fallback name or key
  return fallbackName || key;
};

// Get all category options with labels for dropdown
export const getCategoryOptions = (type, t, userCategories = []) => {
  // Get default categories
  const defaultCats = defaultCategories[type] || [];
  
  // Get user-added categories
  const userCats = userCategories
    .filter(cat => cat.type === type)
    .map(cat => cat.key);
  
  // Combine and remove duplicates
  const allCategories = [...new Set([...defaultCats, ...userCats])];
  
  // Map to options with labels
  return allCategories.map(key => {
    const userCat = userCategories.find(cat => cat.key === key);
    
    // If it's a user category, use their custom name
    if (userCat && userCat.name) {
      return {
        value: key,
        label: userCat.name,
        isUserCategory: true
      };
    }
    
    // Otherwise, get translated label for default categories
    const label = getCategoryLabel(key, type, t);
    
    return {
      value: key,
      label: label,
      isUserCategory: false
    };
  });
};

// Helper to format category display name
export const formatCategoryName = (categoryKey, type, t, userCategories = []) => {
  // First check if it's a user category
  const userCategory = userCategories.find(cat => cat.key === categoryKey);
  if (userCategory && userCategory.name) {
    return userCategory.name;
  }
  
  // Then get translated label for default categories
  return getCategoryLabel(categoryKey, type, t);
};