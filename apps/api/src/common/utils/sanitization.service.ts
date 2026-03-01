import sanitize from 'sanitize-html';

/**
 * Utility class for input sanitization and validation
 */
export class SanitizationService {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(dirty: string): string {
    return sanitize(dirty, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      allowedAttributes: {
        a: ['href'],
      },
      allowedIframeHostnames: [],
    });
  }

  /**
   * Sanitize string input by removing potentially dangerous characters
   */
  static sanitizeString(input: string): string {
    if (!input) return '';

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(email: string): string {
    if (!email) return '';

    return email.toLowerCase().trim().replace(/[<>]/g, '');
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: string | number): number | null {
    if (typeof input === 'number') {
      return isNaN(input) ? null : input;
    }

    const sanitized = input.toString().replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(sanitized);

    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Sanitize phone number input
   */
  static sanitizePhone(phone: string): string {
    if (!phone) return '';

    return phone
      .replace(/[^\d+\-\s()]/g, '') // Keep only digits, +, -, spaces, and parentheses
      .trim();
  }

  /**
   * Sanitize URL input
   */
  static sanitizeUrl(url: string): string {
    if (!url) return '';

    try {
      // Basic URL validation and sanitization
      const sanitized = url.trim().replace(/[<>]/g, '');
      const urlObj = new URL(sanitized);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return '';
      }

      return urlObj.toString();
    } catch {
      return '';
    }
  }

  /**
   * Sanitize array of strings
   */
  static sanitizeStringArray(input: string[]): string[] {
    if (!Array.isArray(input)) return [];

    return input
      .filter((item) => typeof item === 'string')
      .map((item) => this.sanitizeString(item))
      .filter((item) => item.length > 0);
  }

  /**
   * Validate and sanitize object keys recursively
   */
  static sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    if (!obj || typeof obj !== 'object') return {};

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key);

      if (!sanitizedKey) continue;

      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = this.sanitizeNumber(value);
      } else if (Array.isArray(value)) {
        sanitized[sanitizedKey] = this.sanitizeStringArray(value as string[]);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = this.sanitizeObject(
          value as Record<string, unknown>,
        );
      } else {
        sanitized[sanitizedKey] = value;
      }
    }

    return sanitized;
  }
}
