import React from "react";

export const QuizTitle: React.FC<{
  readonly title?: string;
}> = ({ title = "General Knowledge Quiz" }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "80px",
          fontWeight: "bold",
          margin: 0,
          fontFamily: "Arial, sans-serif",
          WebkitTextStroke: "4px #000000",
          paintOrder: "stroke fill",
        }}
      >
        {/* Split title into parts for different colors */}
        <span style={{ color: "#ffffff" }}>General Knowledge </span>
        <span
          style={{
            background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Quiz
        </span>
      </h1>
    </div>
  );
};
