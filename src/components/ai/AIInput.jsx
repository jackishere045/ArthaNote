// src/components/ai/AIInput.jsx
import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

const AIInput = ({ onSend, isLoading, isPendingConfirm }) => {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  // Refocus otomatis setiap kali loading selesai
  useEffect(() => {
    if (!isLoading) {
      // Timeout kecil supaya DOM sudah stabil
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholder = isPendingConfirm
    ? 'Ketik "ya" atau "batal"...'
    : "Ketik transaksi atau tanya sesuatu...";

  return (
    <div className="ai-input-area">
      <div className="ai-input-row">
        <textarea
          ref={inputRef}
          className="ai-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading}
        />
        <button
          className="ai-send-btn"
          onClick={handleSend}
          disabled={isLoading || !value.trim()}
          aria-label="Kirim"
        >
          {isLoading ? (
            <Loader2 size={18} className="ai-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
      <p className="ai-input-hint">
        Enter kirim • Shift+Enter baris baru
      </p>
    </div>
  );
};

export default AIInput;