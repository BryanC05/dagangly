import { clsx } from 'clsx';

export function cn(...inputs) {
  return clsx(inputs);
}

export function visuallyHidden() {
  return {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  };
}

export function focusVisibleRing() {
  return {
    outline: 'none',
    '&:focus-visible': {
      outline: '2px solid hsl(var(--ring))',
      outlineOffset: '2px',
    },
  };
}

export const skipLinkStyles = {
  position: 'absolute',
  top: '-40px',
  left: '0',
  background: 'hsl(var(--primary))',
  color: 'hsl(var(--primary-foreground))',
  padding: '8px 16px',
  zIndex: '100',
  transition: 'top 0.2s',
  '&:focus': {
    top: '0',
  },
};
