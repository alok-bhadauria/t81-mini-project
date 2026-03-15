import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import { Loader2 } from "lucide-react";

const buttoniv = {
    base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background cursor-pointer",
    variants: {
        default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]",
        secondary: "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-background)]",
        outline: "border border-[var(--border-color)] bg-transparent hover:bg-[var(--bg-surface)] text-[var(--text-primary)]",
        ghost: "hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]",
        link: "text-[var(--primary)] underline-offset-4 hover:underline",
        danger: "bg-red-500 text-white hover:bg-red-600",
    },
    sizes: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md text-base",
        icon: "h-10 w-10",
    }
};

const Button = forwardRef(({ className, variant = "default", size = "default", isLoading, icon: Icon, children, ...props }, ref) => {
    return (
        <button
            className={cn(
                buttoniv.base,
                buttoniv.variants[variant],
                buttoniv.sizes[size],
                className
            )}
            ref={ref}
            disabled={isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isLoading && Icon && <Icon className={cn("mr-2 h-4 w-4", !children && "mr-0")} />}
            {children}
        </button>
    );
});

Button.displayName = "Button";

export { Button };
