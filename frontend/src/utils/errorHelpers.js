export const getFriendlyAuthError = (err) => {
  // If we already have a clean message from our own backend
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }

  const errorMessage = err?.message || String(err);

  // Common Firebase Auth Error Codes
  if (errorMessage.includes('auth/user-cancelled') || errorMessage.includes('cancelled by user') || errorMessage.includes('IdP denied access')) {
    return 'Login cancelled by user.';
  }
  if (errorMessage.includes('auth/popup-closed-by-user')) {
    return 'The login popup was closed before completing.';
  }
  if (errorMessage.includes('auth/network-request-failed')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (errorMessage.includes('auth/invalid-credential') || errorMessage.includes('auth/wrong-password') || errorMessage.includes('auth/user-not-found')) {
    return 'Invalid email or password.';
  }
  if (errorMessage.includes('auth/email-already-in-use')) {
    return 'This email is already registered. Please login instead.';
  }
  if (errorMessage.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (errorMessage.includes('auth/too-many-requests')) {
    return 'Too many login attempts. Please try again later.';
  }
  if (errorMessage.includes('auth/account-exists-with-different-credential')) {
    return 'An account already exists with the same email address but different sign-in credentials.';
  }
  if (errorMessage.includes('auth/invalid-email')) {
    return 'The email address is improperly formatted.';
  }

  // Fallback for unknown errors (keep it clean)
  console.error('Unhandled Auth Error:', err);
  return 'Authentication failed. Please try again.';
};
