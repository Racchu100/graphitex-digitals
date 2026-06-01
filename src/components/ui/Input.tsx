import React, { useState } from "react";
import styles from "./Input.module.css";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  showPasswordToggle?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = true, id, className = "", type, showPasswordToggle, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
      setIsPasswordVisible((prev) => !prev);
    };

    const isPasswordType = type === "password";
    // If password toggle is enabled and password is set to visible, render as text input
    const inputType = isPasswordType && showPasswordToggle && isPasswordVisible ? "text" : type;

    return (
      <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ""} ${className}`}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {props.required && <span className={styles.required}>*</span>}
        </label>
        <div className={styles.inputContainer}>
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`${styles.input} ${error ? styles.inputError : ""} ${
              showPasswordToggle && isPasswordType ? styles.inputWithToggle : ""
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            {...props}
          />
          {isPasswordType && showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={styles.toggleButton}
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? (
                <EyeOff className={styles.toggleIcon} size={20} />
              ) : (
                <Eye className={styles.toggleIcon} size={20} />
              )}
            </button>
          )}
        </div>
        {error && (
          <p id={errorId} className={styles.error} role="alert" aria-live="polite">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className={styles.helper}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
