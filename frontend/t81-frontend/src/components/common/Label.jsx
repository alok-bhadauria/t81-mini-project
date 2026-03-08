import { cn } from "../../utils/cn";

export function Label({ className, children, ...props }) {
    return (
        <label
            className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[var(--text-secondary)]",
                className
            )}
            {...props}
        >
            {children}
        </label>
    );
}
