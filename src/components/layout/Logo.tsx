"use client";

import React from "react";

interface LogoProps {
  variant?: "adaptive" | "solid";
  height?: number | string;
  showText?: boolean;
}

export default function Logo({ variant = "adaptive", height = 40, showText = true }: LogoProps) {
  // Convert heights to width aspect ratio roughly 3.5:1 when text is shown, 1:1 for icon only
  const calculatedWidth = typeof height === "number" 
    ? (showText ? height * 3.5 : height) 
    : "auto";

  return (
    <div 
      className={`logo-container ${variant === "solid" ? "logo-solid" : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: height,
        width: calculatedWidth,
        userSelect: "none",
        overflow: "hidden",
        position: "relative",
        transition: "all 0.3s ease",
        ...(variant === "solid" && {
          background: "linear-gradient(135deg, hsl(285, 85%, 45%) 0%, hsl(265, 90%, 40%) 50%, hsl(245, 80%, 35%) 100%)",
          padding: "8px 20px",
          borderRadius: "16px",
          boxShadow: "var(--shadow-md), 0 4px 20px rgba(136, 36, 238, 0.2)",
        })
      }}
    >
      <img
        src="/logo.png"
        alt="Graphitex Digitals"
        className="logo-img"
        style={{
          height: "100%",
          width: showText ? "100%" : "auto",
          objectFit: showText ? "contain" : "cover",
          objectPosition: "left",
          display: "block",
          transition: "filter 0.3s ease",
          // If variant is solid (on a dark purple background in the footer card), 
          // make the logo pure white for a super clean, premium aesthetic.
          ...(variant === "solid" && {
            filter: "brightness(0) invert(1)"
          })
        }}
      />
    </div>
  );
}

