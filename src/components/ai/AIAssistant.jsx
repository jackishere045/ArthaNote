// src/components/ai/AIAssistant.jsx
// Root component: floating button + panel
// Desktop: right sidebar | Mobile: bottom sheet

import React, { useEffect, useRef } from "react";
import { Sparkles, X, Trash2 } from "lucide-react";
import { useAI } from "../../hooks/useAI";
import AIPanel from "./AIPanel";
import "./ai.css";

const AIAssistant = () => {
  const {
    messages,
    isLoading,
    pendingTransaction,
    reminders,
    isOpen,
    setIsOpen,
    sendMessage,
    handleQuickAction,
    loadReminders,
    clearChat,
  } = useAI();

  // Load reminders saat pertama render
  useEffect(() => {
    loadReminders();
  }, []);

  const badgeCount = reminders.filter((r) => r.severity === "danger").length;

  return (
    <>
      {/* ── Floating Button ──────────────────────────────────────────────────── */}
      {/* <button
        className="ai-fab"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Buka AI Assistant"
      >
        {isOpen ? (
          <X size={22} strokeWidth={2.5} />
        ) : (
          <Sparkles size={22} strokeWidth={2} />
        )}
        {!isOpen && badgeCount > 0 && (
          <span className="ai-fab-badge">{badgeCount}</span>
        )}
      </button> */}

      {/* ── Backdrop (mobile only) ───────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="ai-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Panel ───────────────────────────────────────────────────────────── */}
      <div className={`ai-panel ${isOpen ? "ai-panel--open" : ""}`}>
        {/* Header */}
        <div className="ai-panel-header">
          <div className="ai-panel-header-left">
            <div className="ai-avatar">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="ai-panel-title">ArthaNote AI</p>
              <p className="ai-panel-subtitle">
                {isLoading ? "Lagi mikir..." : "Online"}
              </p>
            </div>
          </div>
          <div className="ai-panel-header-right">
            <button
              className="ai-icon-btn"
              onClick={clearChat}
              title="Hapus chat"
            >
              <Trash2 size={15} />
            </button>
            <button
              className="ai-icon-btn"
              onClick={() => setIsOpen(false)}
              title="Tutup"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Reminders strip */}
        {reminders.length > 0 && (
          <div className="ai-reminders">
            {reminders.slice(0, 2).map((r, i) => (
              <div key={i} className={`ai-reminder ai-reminder--${r.severity}`}>
                <span>{r.severity === "danger" ? "⚠️" : r.severity === "warning" ? "🔔" : "ℹ️"}</span>
                <span>{r.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main panel content */}
        <AIPanel
          messages={messages}
          isLoading={isLoading}
          pendingTransaction={pendingTransaction}
          onSend={sendMessage}
          onQuickAction={handleQuickAction}
        />
      </div>
    </>
  );
};

export default AIAssistant;