import React from "react";
import styles from "./PhoneInput.module.css";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  error?: string;
  value: string;
  onChange: (val: string) => void;
  countryCode?: string;
}

export default function PhoneInput({
  label,
  error,
  value,
  onChange,
  countryCode = "+91",
  className = "",
  ...props
}: PhoneInputProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const val = e.target.value.replace(/\D/g, "");
    onChange(val);
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <label className={styles.label}>{label}</label>
      <div className={`${styles.inputContainer} ${error ? styles.errorState : ""}`}>
        <div className={styles.prefix}>{countryCode}</div>
        <input
          type="tel"
          inputMode="tel"
          className={styles.input}
          value={value}
          onChange={handleChange}
          {...props}
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
