import * as React from "react";

type Variant =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "created"
  | "validated"
  | "batched";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  default:
    "bg-gray-100 text-gray-800",
  success:
    "bg-green-100 text-green-800",
  info:
    "bg-blue-100 text-blue-800",
  warning:
    "bg-amber-100 text-amber-800",
  error:
    "bg-red-100 text-red-800",
  created:
    "bg-yellow-100 text-yellow-800",
  validated:
    "bg-green-100 text-green-800",
  batched:
    "bg-blue-100 text-blue-800",
};

export const Badge = ({ className = "", variant = "default", ...props }: BadgeProps) => (
  <span
    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${variantClasses[variant]} ${className}`}
    {...props}
  />
);

export default Badge;

