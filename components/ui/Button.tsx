"use client";

import classNames from "classnames";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gradient" | "secondary" | "danger" | "success" | "outline";
  children: React.ReactNode;
}

export default function Button({ variant = "primary", className, children, ...rest }: ButtonProps) {
  const base = "btn";
  const variantClass = {
    primary: "btn-primary",
    gradient: "btn-gradient",
    secondary: "btn-secondary",
    danger: "btn-danger",
    success: "btn-success",
    outline: "btn-outline",
  }[variant];
  return (
    <button className={classNames(base, variantClass, className)} {...rest}>
      {children}
    </button>
  );
}
