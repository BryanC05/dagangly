import { toast } from 'sonner';

export function showSuccess(message, description) {
  toast.success(message, description ? { description } : undefined);
}

export function showError(message, description) {
  toast.error(message, description ? { description } : undefined);
}

export function showInfo(message, description) {
  toast.info(message, description ? { description } : undefined);
}
