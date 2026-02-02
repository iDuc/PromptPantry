import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // The page should load without errors
    // Check for common UI elements
    await expect(page).toHaveTitle(/PromptPantry/i);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check that we're on the login page
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // Should have login form elements
    await expect(page.locator('form')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Check that we're on the signup page
    await expect(page).toHaveURL(/\/auth\/signup/);
    
    // Should have signup form elements
    await expect(page.locator('form')).toBeVisible();
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/prompts/new');
    
    // Should redirect to login or show auth required
    // The exact behavior depends on your auth implementation
    await expect(page).toHaveURL(/\/(auth\/login|$)/);
  });
});
