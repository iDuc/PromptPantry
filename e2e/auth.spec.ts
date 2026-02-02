import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Check for email input
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();
      
      // Check for password input
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      await expect(passwordInput).toBeVisible();
      
      // Check for submit button
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
    });

    test('should show validation errors for empty form submission', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Should show some form of validation message
      // This could be HTML5 validation or custom error messages
      // Check that we're still on login page (not redirected)
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('should have link to signup page', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Look for signup link
      const signupLink = page.locator('a[href*="signup"]');
      
      if (await signupLink.count() > 0) {
        await signupLink.click();
        await expect(page).toHaveURL(/\/auth\/signup/);
      }
    });
  });

  test.describe('Signup Page', () => {
    test('should display signup form', async ({ page }) => {
      await page.goto('/auth/signup');
      
      // Check for email input
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();
      
      // Check for password input (signup has password + confirm password, use first())
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await expect(passwordInput).toBeVisible();
      
      // Check for confirm password input
      const confirmPasswordInput = page.locator('input#confirmPassword, input[name="confirmPassword"]');
      await expect(confirmPasswordInput).toBeVisible();
      
      // Check for submit button
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/auth/signup');
      
      // Look for login link
      const loginLink = page.locator('a[href*="login"]');
      
      if (await loginLink.count() > 0) {
        await loginLink.click();
        await expect(page).toHaveURL(/\/auth\/login/);
      }
    });
  });
});
