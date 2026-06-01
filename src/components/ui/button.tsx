import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline";

type ButtonBaseProps = {
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = ButtonBaseProps &
  React.ComponentPropsWithoutRef<"button"> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  React.ComponentPropsWithoutRef<"a"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-accent text-paper",
    "hover:-translate-y-0.5 hover:bg-accent-light hover:shadow-md",
  ),
  outline: cn(
    "border border-ink/20 text-ink",
    "hover:border-ink/40 hover:bg-ink/5",
  ),
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-sm px-6 py-3",
    "font-sans text-sm font-medium transition-all duration-300",
    variantStyles[variant],
    className,
  );

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <a href={href} className={classes} {...linkProps}>
        {children}
      </a>
    );
  }

  const { type = "button", ...buttonProps } = props as ButtonAsButton;

  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
