// Helper functions for validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUserInput(
  name?: string,
  email?: string
): { valid: boolean; error?: string } {
  if (name !== undefined) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { valid: false, error: "Name cannot be empty" };
    }
    if (trimmedName.length > 255) {
      return { valid: false, error: "Name cannot exceed 255 characters" };
    }
  }

  if (email !== undefined) {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return { valid: false, error: "Email cannot be empty" };
    }
    if (trimmedEmail.length > 255) {
      return { valid: false, error: "Email cannot exceed 255 characters" };
    }
    if (!isValidEmail(trimmedEmail)) {
      return { valid: false, error: "Invalid email format" };
    }
  }

  return { valid: true };
}

export function isPositiveInteger(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}
