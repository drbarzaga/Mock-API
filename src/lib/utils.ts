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

export function validateProductInput(
  name?: string,
  description?: string
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

  if (description !== undefined) {
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      return { valid: false, error: "Description cannot be empty" };
    }
  }

  return { valid: true };
}

// Pagination utilities
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function parsePaginationParams(
  pageParam?: string,
  limitParam?: string
): { valid: boolean; params?: PaginationParams; error?: string } {
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 10;
  const MAX_LIMIT = 100;

  let page = DEFAULT_PAGE;
  let limit = DEFAULT_LIMIT;

  if (pageParam !== undefined) {
    const parsedPage = Number.parseInt(pageParam, 10);
    if (Number.isNaN(parsedPage) || parsedPage < 1) {
      return {
        valid: false,
        error: "Page must be a positive integer",
      };
    }
    page = parsedPage;
  }

  if (limitParam !== undefined) {
    const parsedLimit = Number.parseInt(limitParam, 10);
    if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
      return {
        valid: false,
        error: "Limit must be a positive integer",
      };
    }
    if (parsedLimit > MAX_LIMIT) {
      return {
        valid: false,
        error: `Limit cannot exceed ${MAX_LIMIT}`,
      };
    }
    limit = parsedLimit;
  }

  const offset = (page - 1) * limit;

  return {
    valid: true,
    params: {
      page,
      limit,
      offset,
    },
  };
}
