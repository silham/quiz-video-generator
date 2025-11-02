import React from "react";

export const QuestionNumber: React.FC<{
  readonly number: number;
}> = ({ number }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "40px",
        left: "80px",
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        backgroundColor: "#f9d013",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
        border: "6px solid #222",
      }}
    >
      <span
        style={{
          fontSize: "64px",
          fontWeight: "bold",
          color: "#222",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {number}
      </span>
    </div>
  );
};
