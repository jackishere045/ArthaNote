// src/components/ai/AIQuickActions.jsx
import React from "react";
import { TrendingUp, Plus, ShieldCheck, Calendar } from "lucide-react";

const ACTIONS = [
  { id: "monthly", label: "Analisa bulan ini", icon: TrendingUp },
  { id: "add", label: "Tambah transaksi", icon: Plus },
  { id: "budget", label: "Budget aman?", icon: ShieldCheck },
  { id: "weekly", label: "Ringkas minggu ini", icon: Calendar },
];

const AIQuickActions = ({ onAction }) => (
  <div className="ai-quick-actions">
    {ACTIONS.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        className="ai-quick-btn"
        onClick={() => onAction(id)}
      >
        <Icon size={13} />
        <span>{label}</span>
      </button>
    ))}
  </div>
);

export default AIQuickActions;