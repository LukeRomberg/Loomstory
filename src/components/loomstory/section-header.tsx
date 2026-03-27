interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  children,
  className = "",
}: SectionHeaderProps) {
  return (
    <h4
      className={`text-xs text-muted-foreground font-heading tracking-wider mb-2 ${className}`}
    >
      {children}
    </h4>
  );
}
