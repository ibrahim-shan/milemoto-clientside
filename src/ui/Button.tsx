// src/components/ui/Button.tsx
'use client';

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  ReactNode,
} from 'react';
import Link from 'next/link';

type CoreVariant =
  | 'solid'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'subtle'
  | 'destructive'
  | 'success'
  | 'link';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type CommonProps = {
  variant?: CoreVariant;
  size?: Size;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  icon?: boolean;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

// Forward-only-safe props (type-level)
type NativeButtonForwardProps = Omit<
  ButtonAsButton,
  keyof CommonProps | 'type' | 'className' | 'disabled'
>;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function spinnerFor(size: Size) {
  const s = size === 'xs' ? 'h-3.5 w-3.5' : size === 'lg' || size === 'xl' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <span
      className={`${s} rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin`}
      aria-hidden
    />
  );
}

function baseClasses(size: Size, fullWidth?: boolean, icon?: boolean) {
  const sizes = {
    xs: 'h-8 px-3 text-[11px]',
    sm: 'h-9 px-4 text-xs',
    md: 'h-10 px-5 text-sm',
    lg: 'h-11 px-6 text-base',
    xl: 'h-12 px-8 text-base',
  } as const;
  const iconSizes = {
    xs: 'h-8 w-8 p-0',
    sm: 'h-9 w-9 p-0',
    md: 'h-10 w-10 p-0',
    lg: 'h-11 w-11 p-0',
    xl: 'h-12 w-12 p-0',
  } as const;

  return cx(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition',
    'focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-60',
    'motion-safe:active:scale-[0.99]',
    'flex-nowrap min-w-0 whitespace-nowrap',
    icon ? iconSizes[size] : sizes[size],
    fullWidth && 'w-full',
  );
}

function variantClasses(variant: NonNullable<ButtonProps['variant']>) {
  switch (variant) {
    case 'solid':
      return 'bg-primary text-primary-foreground hover:bg-primary/90';
    case 'secondary':
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    case 'outline':
      return 'border border-border text-foreground hover:bg-muted/60';
    case 'ghost':
      return 'text-foreground hover:bg-foreground/10';
    case 'subtle':
      return 'bg-muted text-foreground hover:bg-muted/80';
    case 'destructive':
      return 'bg-error text-white hover:bg-error/90';
    case 'success':
      return 'bg-success text-white hover:bg-success/90';
    case 'link':
      return 'bg-transparent text-primary underline-offset-4 hover:underline focus-visible:ring-0 h-auto p-0 rounded-none';
    default:
      return 'bg-primary text-primary-foreground';
  }
}

export function Button(props: ButtonProps) {
  const {
    variant = 'solid',
    size = 'md',
    fullWidth,
    isLoading,
    loadingLabel = 'Loading',
    leftIcon,
    rightIcon,
    icon,
    className: userClassName,
    children,
  } = props;

  const classes = cx(baseClasses(size, fullWidth, icon), variantClasses(variant), userClassName);

  const content = (
    <>
      {isLoading && spinnerFor(size)}

      {!isLoading && !icon && leftIcon && (
        <span className="shrink-0 leading-none [&>svg]:block [&>svg]:align-middle">{leftIcon}</span>
      )}

      {!icon && (
        <span
          className={cx(
            'inline-flex items-center gap-2 truncate leading-none',
            isLoading && 'opacity-0',
          )}
        >
          {children}
        </span>
      )}

      {!isLoading && !icon && rightIcon && (
        <span className="shrink-0 leading-none [&>svg]:block [&>svg]:align-middle">
          {rightIcon}
        </span>
      )}

      {isLoading && <span className="sr-only">{loadingLabel}</span>}
    </>
  );

  // LINK branch
  if ('href' in props && props.href) {
    const { href, onClick } = props as ButtonAsLink;

    const handleClick: React.MouseEventHandler<HTMLAnchorElement> = e => {
      if (isLoading) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClick?.(e);
    };

    return (
      <Link
        href={href}
        onClick={handleClick}
        className={cx(classes, isLoading && 'pointer-events-none')}
        aria-busy={isLoading || undefined}
        aria-disabled={isLoading ? true : undefined}
        data-loading={isLoading || undefined}
      >
        {content}
      </Link>
    );
  }

  // BUTTON branch
  const { type, ...btnRestRaw } = props as ButtonAsButton;
  const buttonRest = btnRestRaw as NativeButtonForwardProps &
    DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

  return (
    <button
      {...buttonRest}
      type={type ?? 'button'}
      className={classes}
      data-variant={variant}
      data-size={size}
      data-loading={isLoading || undefined}
      aria-busy={isLoading || undefined}
      disabled={isLoading || buttonRest.disabled}
    >
      {content}
    </button>
  );
}
