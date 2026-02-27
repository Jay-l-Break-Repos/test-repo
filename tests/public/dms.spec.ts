import { test, expect } from '@playwright/test';

test.describe('Public Environment E2E', () => {

    test.describe('1. Home Page & Workspace Navigation', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/');
        });

        test('Verify Content', async ({ page }) => {
            await expect(page).toHaveTitle(/DocuServe/);
            await expect(page.getByText('Welcome to DocuServe')).toBeVisible();
            await expect(page.locator('.home-logo')).not.toBeVisible();
            await expect(page.locator('.hero-description')).toBeVisible();
        });

        test('CTA: Go to Workspace', async ({ page }) => {
            await page.getByText('Go to Workspace').click();
            await expect(page).toHaveURL(/\/documents/);
        });

        test('CTA: Upload File', async ({ page }) => {
            await page.getByText('Upload File').click();
            await expect(page).toHaveURL(/\/upload/);
        });
    });

    test.describe('2. Documents List (/documents)', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/documents');
        });

        test('Verify Layout & Elements', async ({ page }) => {
            // Sidebar
            await expect(page.getByRole('navigation')).toBeVisible(); // Assuming sidebar uses <nav> or role accessibility
            // Adjust selector if generic div, e.g. .sidebar or based on text 'Documents'

            // Upload Button (usually in Header or Sidebar)
            // User said "left side bar, upload button".
            // Let's check for 'Upload' button or link.
            const uploadBtn = page.getByRole('button', { name: /Upload/i }).or(page.getByRole('link', { name: /Upload/i }));
            await expect(uploadBtn.first()).toBeVisible();

            // Verify Seeded Data (Public Keynote)
        });

        test('CTA: Upload Document', async ({ page }) => {
            const uploadBtn = page.getByRole('button', { name: /Upload/i }).or(page.getByRole('link', { name: /Upload/i }));
            await expect(uploadBtn.first()).toBeVisible();
            await uploadBtn.first().click();
            await expect(page).toHaveURL(/.*\/upload/);
        });

    });

    // Sidebar Tests (Shared Logic)
    const pagesWithSidebar = ['/documents', '/upload'];

    for (const url of pagesWithSidebar) {
        test.describe(`Sidebar on ${url}`, () => {
            test.beforeEach(async ({ page }) => {
                await page.goto(url);
            });

            test(`Structure & Navigation from ${url}`, async ({ page }) => {
                const sidebar = page.locator('aside.sidebar');
                await expect(sidebar).toBeVisible();

                // Brand Click -> Home (only if not already on simple test)
                const brandClickable = sidebar.locator('img[alt="DocuServe"]').locator('..');
                await brandClickable.click();
                await expect(page).toHaveURL(/.*\/$/);
            });

            test(`Expand/Collapse on ${url}`, async ({ page }) => {
                const sidebar = page.locator('aside.sidebar');
                // Initial
                await expect(sidebar).toHaveCSS('width', '240px');

                // Collapse
                await sidebar.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') }).click();
                await expect(sidebar).toHaveCSS('width', '64px');

                // Expand
                await sidebar.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }).click();
                await expect(sidebar).toHaveCSS('width', '240px');
            });

            test(`Links Navigation on ${url}`, async ({ page }) => {
                const sidebar = page.locator('aside.sidebar');
                // Check active state logic
                // If we are on /documents, 'Documents' should be active
                if (url.includes('documents')) {
                    await expect(sidebar.getByRole('link', { name: /Documents/i })).toHaveClass(/active/);
                } else if (url.includes('upload')) {
                    await expect(sidebar.getByRole('link', { name: /Upload/i })).toHaveClass(/active/);
                }
            });
        });
    }

    test.describe('3. Upload Functionality (/upload)', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/upload');
        });



        test('Upload Flow: Submit & Cancel', async ({ page }) => {
            const fileName = 'feature-test.txt';

            // 1. Select File
            await page.setInputFiles('input[type="file"]', {
                name: fileName,
                mimeType: 'text/plain',
                buffer: Buffer.from('Testing upload functionality details.')
            });

            // 2. Verify Modal Appears with "Submit"
            // The logic shows content when 'file' is set. 
            // We assume the "file-card-premium" is the "popup" user refers to.
            await expect(page.locator('.file-card-premium')).toBeVisible();
            const submitBtn = page.getByRole('button', { name: /Submit/i });
            const cancelBtn = page.getByRole('button', { name: /Cancel/i });

            await expect(submitBtn).toBeVisible();
            await expect(cancelBtn).toBeVisible();

            // 3. Test Cancel Flow
            await cancelBtn.click();
            await expect(page.locator('.file-card-premium')).not.toBeVisible();

            // 4. Re-select for Submit Flow
            await page.setInputFiles('input[type="file"]', {
                name: fileName,
                mimeType: 'text/plain',
                buffer: Buffer.from('Testing upload functionality details.')
            });
            await submitBtn.click();

            // 5. Verify Success Message & Redirect
            // Toast check (optional, but requested "confirmation message")
            await expect(page.getByText('Document uploaded successfully!')).toBeVisible();
            await expect(page).toHaveURL(/\/documents/);
            await expect(page.getByText(fileName)).toBeVisible();
        });

        test('Upload Non-Text File (PNG)', async ({ page }) => {
            const fileName = 'my-image.png';
            const pngBuffer = Buffer.from('R0lGODlhAgABAPAAAP///wAAACH5BAAAAAAALAAAAAACAAEAAAICBAoAOw==', 'base64');
            await page.setInputFiles('input[type="file"]', {
                name: fileName,
                mimeType: 'image/png',
                buffer: pngBuffer
            });
            await page.getByRole('button', { name: /Submit/i }).click();
            await expect(page.getByText('Document uploaded successfully!')).toBeVisible();
            await expect(page).toHaveURL(/\/documents/);
            await expect(page.getByText(fileName)).toBeVisible();
        });

        test('Back Button Navigation', async ({ page }) => {
            const backBtn = page.getByRole('button', { name: /Back/i }).or(page.getByTestId('back-button'));
            if (await backBtn.count() > 0) {
                await backBtn.click();
                await expect(page).toHaveURL(/\/documents/);
            }
        });
    });

    test.describe('4. Document View Functionality', () => {
        test('View Private Text Document', async ({ page }) => {
            // Upload a file first since seeding is disabled
            await page.goto('/upload');
            const fileName = 'test-file.txt';
            const fileContent = 'test file contents';

            await page.setInputFiles('input[type="file"]', {
                name: fileName,
                mimeType: 'text/plain',
                buffer: Buffer.from(fileContent)
            });
            await page.getByRole('button', { name: /Submit/i }).click();
            await expect(page).toHaveURL(/\/documents/);
            // Click the uploaded file
            await page.getByText(fileName).click();
            await expect(page).toHaveURL(/\/documents\/\d+/);
            // Verify Content
            await expect(page.getByText(fileContent)).toBeVisible();
            // Back
            await page.getByRole('button', { name: /Back/i }).click();
            await expect(page).toHaveURL(/\/documents/);
        });
        test('View Uploaded Image (Metadata View)', async ({ page }) => {
            await page.goto('/upload');
            const fileName = 'my-image.png';
            const pngBuffer = Buffer.from('R0lGODlhAgABAPAAAP///wAAACH5BAAAAAAALAAAAAACAAEAAAICBAoAOw==', 'base64');
            await page.setInputFiles('input[type="file"]', {
                name: fileName,
                mimeType: 'image/png',
                buffer: pngBuffer
            });
            await page.getByRole('button', { name: /Submit/i }).click();
            await expect(page).toHaveURL(/\/documents/);

            // Click the image file
            await page.getByText(fileName).click();
            await expect(page).toHaveURL(/\/documents\/\d+/);
            await expect(page.getByText(fileName)).toBeVisible();
        });
    });

    test.describe('5. Accessibility: Keyboard Navigation', () => {
        const pages = ['/', '/documents', '/upload'];
        for (const url of pages) {
            test(`Tab Key Navigation on ${url}`, async ({ page }) => {
                await page.goto(url);
                // Reset focus to body
                await page.focus('body');
                // Press Tab and verify focus moves to an interactive element
                // We don't check a specific element ID as it varies, 
                // but checking that activeElement is NOT body is a good baseline.
                await page.keyboard.press('Tab');
                const activeTagName = await page.evaluate(() => document.activeElement?.tagName);
                expect(activeTagName).not.toBe('BODY');
                expect(activeTagName).not.toBeNull();
                // Press Tab again to ensure flow continues
                await page.keyboard.press('Tab');
                const nextActiveTagName = await page.evaluate(() => document.activeElement?.tagName);
                expect(nextActiveTagName).not.toBeNull();
            });
        }
    });

    test.describe('6. Document Deletion', () => {
        test('Delete button opens confirmation modal', async ({ page }) => {
            // Upload a document to delete
            await page.goto('/upload');
            const fileName = 'delete-test.txt';
            await page.setInputFiles('input[type="file"]', {
                name: fileName,
                mimeType: 'text/plain',
                buffer: Buffer.from('This document will be deleted.')
            });
            await page.getByRole('button', { name: /Submit/i }).click();
            await expect(page).toHaveURL(/\/documents/);
            await expect(page.getByText(fileName)).toBeVisible();

            // Click the delete (trash) button for this document
            const row = page.locator('tr', { has: page.getByText(fileName) });
            await row.getByTitle('Delete').click();

            // Confirmation modal should appear
            await expect(page.getByRole('heading', { name: /Delete Document/i })).toBeVisible();
            await expect(page.getByText(/permanently delete/i)).toBeVisible();
            await expect(page.getByText(fileName)).toBeVisible();
            await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /Delete Permanently/i })).toBeVisible();
        });

        test('Cancel button closes modal without deleting', async ({ page }) => {
            // Upload a document
            await page.goto('/upload');
            const fileName = 'cancel-delete-test.txt';
            await page.setInputFiles('input[type="file"]', {
                name: fileName,
                mimeType: 'text/plain',
                buffer: Buffer.from('This document should NOT be deleted.')
            });
            await page.getByRole('button', { name: /Submit/i }).click();
            await expect(page).toHaveURL(/\/documents/);
            await expect(page.getByText(fileName)).toBeVisible();

            // Open delete modal
            const row = page.locator('tr', { has: page.getByText(fileName) });
            await row.getByTitle('Delete').click();
            await expect(page.getByRole('heading', { name: /Delete Document/i })).toBeVisible();

            // Click Cancel
            await page.getByRole('button', { name: /Cancel/i }).click();

            // Modal should be gone, document still in list
            await expect(page.getByRole('heading', { name: /Delete Document/i })).not.toBeVisible();
            await expect(page.getByText(fileName)).toBeVisible();
        });

        test('Confirm deletion removes document from list and shows success toast', async ({ page }) => {
            // Upload a document to delete
            await page.goto('/upload');
            const fileName = 'confirm-delete-test.txt';
            await page.setInputFiles('input[type="file"]', {
                name: fileName,
                mimeType: 'text/plain',
                buffer: Buffer.from('This document will be permanently deleted.')
            });
            await page.getByRole('button', { name: /Submit/i }).click();
            await expect(page).toHaveURL(/\/documents/);
            await expect(page.getByText(fileName)).toBeVisible();

            // Open delete modal and confirm
            const row = page.locator('tr', { has: page.getByText(fileName) });
            await row.getByTitle('Delete').click();
            await expect(page.getByRole('heading', { name: /Delete Document/i })).toBeVisible();
            await page.getByRole('button', { name: /Delete Permanently/i }).click();

            // Modal should close, document removed from list, success toast shown
            await expect(page.getByRole('heading', { name: /Delete Document/i })).not.toBeVisible();
            await expect(page.getByText(fileName)).not.toBeVisible();
            await expect(page.getByText(/permanently deleted/i)).toBeVisible();
        });
    });
});
