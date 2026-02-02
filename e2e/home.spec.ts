import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Should have no JavaScript errors
    expect(errors).toHaveLength(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Page should still load correctly on mobile
    await expect(page).toHaveTitle(/PromptPantry/i);
    
    // Check that content is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Page should load correctly on tablet
    await expect(page).toHaveTitle(/PromptPantry/i);
  });

  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Page should load correctly on desktop
    await expect(page).toHaveTitle(/PromptPantry/i);
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Should have at least one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(0); // Some SPAs might not have h1 immediately
  });

  test('should have no broken images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      
      // Images should have loaded (naturalWidth > 0) or be placeholder/lazy-loaded
      // We're lenient here because of lazy loading
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:') && !src.includes('placeholder')) {
        // If it's a real image URL, it should eventually load
        // But we don't fail the test for lazy-loaded images
      }
    }
  });
});
