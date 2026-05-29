// src/components/ai/AIMessage.jsx
import React from "react";
import { Sparkles } from "lucide-react";

const AIMessage = ({ message }) => {
  const isAI = message.role === "ai";
  const isUser = message.role === "user";

  if (message.role === "system") return null;

  // Format teks dengan markdown sederhana
  const formatContent = (text) => {
    if (!text) return "";
    return text
      .split("\n")
      .map((line, i) => {
        // Bold **text**
        const withBold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        // Bullet •
        const isBullet = withBold.startsWith("•");
        return (
          <p
            key={i}
            className={isBullet ? "ai-msg-bullet" : ""}
            dangerouslySetInnerHTML={{ __html: withBold }}
          />
        );
      });
  };

  return (
    <div className={`ai-message ${isAI ? "ai-message--ai" : "ai-message--user"}`}>
      {/* AI avatar */}
      {isAI && (
        <div className="ai-msg-avatar">
          <Sparkles size={12} />
        </div>
      )}

      <div className={`ai-bubble ${isAI ? "ai-bubble--ai" : "ai-bubble--user"} ${getTypeBubbleClass(message.type)}`}>
        <div className="ai-bubble-content">
          {formatContent(message.content)}
        </div>

        <span className="ai-bubble-time">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

const getTypeBubbleClass = (type) => {
  switch (type) {
    case "success": return "ai-bubble--success";
    case "error": return "ai-bubble--error";
    case "confirm": return "ai-bubble--confirm";
    default: return "";
  }
};

const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default AIMessage;