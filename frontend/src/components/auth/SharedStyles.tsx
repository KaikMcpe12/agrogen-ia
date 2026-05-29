import React from "react";

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, required, error, children }: FieldProps) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "#1a2e1a",
          marginBottom: "0.4rem",
        }}
      >
        {label}
        {required && <span style={{ color: "#c0392b", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ color: "#c0392b", fontSize: "0.75rem", marginTop: 4, marginBottom: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.85rem",
  border: "1.5px solid #d6d1c4",
  borderRadius: 8,
  fontSize: "0.875rem",
  backgroundColor: "#fff",
  color: "#1a2e1a",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

export const submitBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.8rem",
  backgroundColor: "#1a3a2a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: "0.95rem",
  fontWeight: 600,
  cursor: "pointer",
  marginTop: "0.5rem",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
};