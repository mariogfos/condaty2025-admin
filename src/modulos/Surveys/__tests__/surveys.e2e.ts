import { test, expect } from '@playwright/test';

test.describe('Módulo de Encuestas - Flujo de Respuesta', () => {
  // Nota: Estas pruebas asumen que hay un servidor corriendo en el puerto 3000
  // y que el estado inicial tiene al menos una encuesta pendiente.
  
  test.beforeEach(async ({ page }) => {
    // 1. Mockear las llamadas al API (Globs para interceptar TODO y asegurar independencia)
    await page.route('**/*iam*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 1, name: 'Test Admin', role: { codes: 'adm', abilities: '**1**|surveys:CRUD|' }, client_id: 1 }
          }
        })
      });
    });

    await page.route('**/*counts*', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { P: 1, R: 0, E: 0 } }) });
      });

    await page.route('**/*survey*', async route => {
        if (route.request().method() === 'GET') {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [{ id: 1, title: 'Prueba d encuestas a administradores', status: 'P' }] }) });
        } else {
            route.continue();
        }
      });

    await page.route('**/*user*', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
      });

    await page.route('**/api/login', async route => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { token: 'mock' } }) });
    });

    // 2. Inyectar localStorage
    await page.addInitScript(() => {
      localStorage.setItem('/adm-iamtoken', JSON.stringify({
        token: 'mock-token-123',
        user: { id: 1, client_id: 1 }
      }));
      localStorage.setItem('condaty_client_id', '1');
    });

    await page.goto('/mis-encuestas'); 
  });

  test('debe verificar que la ruta del módulo es accesible', async ({ page }) => {
    // Verificamos que no nos redirija
    await expect(page).not.toHaveURL(/login/, { timeout: 15000 });
    const response = await page.goto('/mis-encuestas');
    expect(response?.status()).toBeLessThan(400);
  });

  test('debe cargar la lista de encuestas correctamente', async ({ page }) => {
    // Esperamos a que el texto aparezca. Ponemos un margen mayor.
    const surveyTitle = page.locator('text=Prueba d encuestas a administradores').first();
    await expect(surveyTitle).toBeVisible({ timeout: 25000 });
    
    const pendingText = page.locator('text=PENDIENTES').first();
    await expect(pendingText).toBeVisible();
  });
});
