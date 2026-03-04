import { test, expect, request as playwrightRequest } from '@playwright/test';

const API_BASE = 'http://localhost:8000';

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
            await expect(page.getByRole('navigation')).toBeVisible();

            const uploadBtn = page.getByRole('button', { name: /Upload/i }).or(page.getByRole('link', { name: /Upload/i }));
            await expect(uploadBtn.first()).toBeVisible();
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

                const brandClickable = sidebar.locator('img[alt="DocuServe"]').locator('..');
                await brandClickable.click();
                await expect(page).toHaveURL(/.*\/$/);
            });

            test(`Expand/Collapse on ${url}`, async ({ page }) => {
                const sidebar = page.locator('aside.sidebar');
                await expect(sidebar).toHaveCSS('width', '240px');

                await sidebar.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') }).click();
                await expect(sidebar).toHaveCSS('width', '64px');

                await sidebar.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }).click();
                await expect(sidebar).toHaveCSS('width', '240px');
            });

            test(`Links Navigation on ${url}`, async ({ page }) => {
                const sidebar = page.locator('aside.sidebar');
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

            await page.setInputFiles('input[type="file"]', {
                name: fileName,
                mimeType: 'text/plain',
                buffer: Buffer.from('Testing upload functionality details.')
            });

            await expect(page.locator('.file-card-premium')).toBeVisible();
            const submitBtn = page.getByRole('button', { name: /Submit/i });
            const cancelBtn = page.getByRole('button', { name: /Cancel/i });

            await expect(submitBtn).toBeVisible();
            await expect(cancelBtn).toBeVisible();

            await cancelBtn.click();
            await expect(page.locator('.file-card-premium')).not.toBeVisible();

            await page.setInputFiles('input[type="file"]', {
                name: fileName,
                mimeType: 'text/plain',
                buffer: Buffer.from('Testing upload functionality details.')
            });
            await submitBtn.click();

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
            await page.getByText(fileName).click();
            await expect(page).toHaveURL(/\/documents\/\d+/);
            await expect(page.getByText(fileContent)).toBeVisible();
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
                await page.focus('body');
                await page.keyboard.press('Tab');
                const activeTagName = await page.evaluate(() => document.activeElement?.tagName);
                expect(activeTagName).not.toBe('BODY');
                expect(activeTagName).not.toBeNull();
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
            const modal = page.locator('[class*="rounded-2xl"]').filter({ has: page.getByRole('heading', { name: /Delete Document/i }) });
            await expect(modal.getByRole('heading', { name: /Delete Document/i })).toBeVisible();
            await expect(page.getByText(/permanently delete/i)).toBeVisible();
            await expect(modal.locator('tr').getByText(fileName)).toBeVisible();
            await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /Delete Permanently/i })).toBeVisible();
        });

        test('Cancel button closes modal without deleting', async ({ page }) => {
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

            const row = page.locator('tr', { has: page.getByText(fileName) });
            await row.getByTitle('Delete').click();
            await expect(page.getByRole('heading', { name: /Delete Document/i })).toBeVisible();

            await page.getByRole('button', { name: /Cancel/i }).click();

            // Modal gone, document still in list
            await expect(page.getByRole('heading', { name: /Delete Document/i })).not.toBeVisible();
            await expect(page.getByText(fileName)).toBeVisible();
        });

        test('Confirm deletion removes document from list and shows success toast', async ({ page }) => {
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

            const row = page.locator('tr', { has: page.getByText(fileName) });
            await row.getByTitle('Delete').click();
            await expect(page.getByRole('heading', { name: /Delete Document/i })).toBeVisible();
            await page.getByRole('button', { name: /Delete Permanently/i }).click();

            // Modal closes, document removed, success toast shown
            await expect(page.getByRole('heading', { name: /Delete Document/i })).not.toBeVisible();
            await expect(page.getByText(fileName)).not.toBeVisible();
            await expect(page.getByText(/permanently deleted/i)).toBeVisible({ timeout: 8000 });
        });
    });

    // ---------------------------------------------------------------------------
    // 7. DELETE /api/documents/{id} — Backend API Tests
    // ---------------------------------------------------------------------------
    test.describe('7. DELETE /api/documents/{id} — Backend API', () => {

        test('Successful deletion: returns 200, removes DB record', async () => {
            const apiContext = await playwrightRequest.newContext({ baseURL: API_BASE });

            // Upload a document to get a real ID
            const uploadResponse = await apiContext.post('/api/documents/upload', {
                multipart: {
                    file: {
                        name: 'api-delete-success.txt',
                        mimeType: 'text/plain',
                        buffer: Buffer.from('Content for deletion test.'),
                    },
                },
            });
            expect(uploadResponse.status()).toBe(200);
            const uploaded = await uploadResponse.json();
            const docId = uploaded.id as number;

            // Delete it
            const deleteResponse = await apiContext.delete(`/api/documents/${docId}`);
            expect(deleteResponse.status()).toBe(200);
            const body = await deleteResponse.json();
            expect(body.success).toBe(true);
            expect(body.message).toContain('permanently deleted');

            // Verify it's gone
            const getResponse = await apiContext.get(`/api/documents/${docId}`);
            expect(getResponse.status()).toBe(404);

            await apiContext.dispose();
        });

        test('404 error: deleting a non-existent document returns 404', async () => {
            const apiContext = await playwrightRequest.newContext({ baseURL: API_BASE });

            const response = await apiContext.delete('/api/documents/999999999');
            expect(response.status()).toBe(404);
            const body = await response.json();
            expect(body.detail).toBe('Document not found');

            await apiContext.dispose();
        });

        test('Edge case: deletion succeeds even when physical file is already missing', async () => {
            const apiContext = await playwrightRequest.newContext({ baseURL: API_BASE });

            // Upload a document
            const uploadResponse = await apiContext.post('/api/documents/upload', {
                multipart: {
                    file: {
                        name: 'api-delete-no-file.txt',
                        mimeType: 'text/plain',
                        buffer: Buffer.from('Content for missing-file edge case.'),
                    },
                },
            });
            expect(uploadResponse.status()).toBe(200);
            const uploaded = await uploadResponse.json();
            const docId = uploaded.id as number;

            // First delete — succeeds normally
            const firstDelete = await apiContext.delete(`/api/documents/${docId}`);
            expect(firstDelete.status()).toBe(200);
            const firstBody = await firstDelete.json();
            expect(firstBody.success).toBe(true);

            // Second delete — record gone, must return 404 not 500
            const secondDelete = await apiContext.delete(`/api/documents/${docId}`);
            expect(secondDelete.status()).toBe(404);

            await apiContext.dispose();
        });
    });
});
