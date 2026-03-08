import { cn } from "../../utils/cn";

export function Card({ className, children, ...props }) {
    return (
        <div
            className={cn(
                "rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
