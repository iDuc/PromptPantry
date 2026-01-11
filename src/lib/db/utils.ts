/**
 * Retry utility for database operations that may fail due to transient connection issues
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 500
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message || '';

      // Check if it's a transient connection error
      const isTransientError =
        errorMessage.includes('Tenant or user not found') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('FATAL') ||
        errorMessage.includes('timeout');

      if (!isTransientError || attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const waitTime = delayMs * Math.pow(2, attempt - 1);
      console.log(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}
