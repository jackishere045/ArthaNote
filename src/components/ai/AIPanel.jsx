// src/components/ai/AIPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import AIMessage from "./AIMessage";
import AIQuickActions from "./AIQuickActions";
import AIInput from "./AIInput";

const AIPanel = ({ messages, isLoading, pendingTransaction, onSend, onQuickAction }) => {
  const bottomRef = useRef(null);
  const [showQuickActions, setShowQuickActions] = useState(true);

  // Auto-scroll ke bawah
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Sembunyikan quick actions setelah ada interaksi
  useEffect(() => {
    if (messages.length > 1) setShowQuickActions(false);
  }, [messages.length]);

  return (
    <div className="ai-panel-body">
      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div className="ai-messages">
        {messages.map((msg) => (
          <AIMessage key={msg.id} message={msg} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="ai-message ai-message--ai">
            <div className="ai-bubble ai-bubble--ai">
              <div className="ai-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick Actions (muncul di atas input) ───────────────────────────── */}
      {showQuickActions && !pendingTransaction && (
        <AIQuickActions onAction={(action) => {
          setShowQuickActions(false);
          onQuickAction(action);
        }} />
      )}

      {/* ── Input ───────────────────────────────────────────────────────────── */}
      <AIInput
        onSend={onSend}
        isLoading={isLoading}
        isPendingConfirm={!!pendingTransaction}
      />
    </div>
  );
};

export default AIPanel;