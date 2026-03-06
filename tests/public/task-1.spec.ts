import { test, expect } from '@playwright/test';

test.describe('Document Deletion Feature', () => {
  test('should delete a document with confirmation', async ({ page }) => {
    // Create a test document first
    await page.goto('/upload');
    const testFile = await page.locator('input[type="file"]');
    await testFile.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test content')
    });
    await page.click('button[type="submit"]');
    
    // Navigate to documents page
    await page.goto('/documents');
    
    // Click delete button for the document
    await page.click('[data-testid="delete-document"]');
    
    // Confirm deletion in modal
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify document is deleted (no longer in list)
    await expect(page.locator('text=test.txt')).not.toBeVisible();
  });

  test('should not delete document when canceling confirmation', async ({ page }) => {
    // Navigate to documents page
    await page.goto('/documents');
    
    // Click delete button
    await page.click('[data-testid="delete-document"]');
    
    // Cancel deletion
    await page.click('[data-testid="cancel-delete"]');
    
    // Verify document still exists
    await expect(page.locator('text=test.txt')).toBeVisible();
  });
});