import { type ComponentProps, type ReactNode } from 'react';
import './Button.scss';

type ButtonVariant = 'primary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const classNames = `btn btn--${variant} btn--${size} ${className}`.trim();

  return (
    <button className={classNames} {...props}>
      {icon && <span className="btn__icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
