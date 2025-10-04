import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined';
}


export const Card = ({ className = "", ...props }: CardProps) => (
  <div
    className={`bg-[var(--color-card)] text-[var(--color-card-foreground)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-soft)] ${className}`}
    {...props}
  />
);

export const CardHeader = ({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-6 py-4 border-b border-[var(--color-border)] ${className}`} {...props} />
);

export const CardTitle = ({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-base font-semibold text-gray-900 ${className}`} {...props} />
);

export const CardContent = ({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-6 py-4 ${className}`} {...props} />
);

export default Card;

