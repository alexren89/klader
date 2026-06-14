import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        {
          "bg-gray-100 text-gray-700": variant === "default",
          "bg-sage-100 text-sage-700": variant === "success",
          "bg-earth-100 text-earth-700": variant === "warning",
          "bg-red-100 text-red-700": variant === "danger",
          "bg-blue-100 text-blue-700": variant === "info",
          "border border-gray-300 text-gray-600 bg-transparent": variant === "outline",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
