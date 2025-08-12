// src/components/ui/Card.tsx - Purpose: simple container primitives
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>{children}</div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <h2 className={`text-xl font-semibold mb-4 ${className}`}>{children}</h2>
  );
}
