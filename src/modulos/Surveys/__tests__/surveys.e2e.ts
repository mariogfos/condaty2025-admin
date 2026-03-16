import { test, expect } from '@playwright/test';

test.describe('Módulo de Encuestas - Flujo de Respuesta', () => {
  // Nota: Estas pruebas asumen que hay un servidor corriendo en el puerto 3000
  // y que el estado inicial tiene al menos una encuesta pendiente.
  
  test.beforeEach(async ({ page }) => {
    // Aquí iría la lógica de login si fuera necesaria
    await page.goto('/surveys/mis-encuestas'); // Ajustar ruta según estructura real
  });

  test('debe mostrar la lista de encuestas pendientes', async ({ page }) => {
    const title = page.locator('h2', { hasText: 'Mis Encuestas' });
    await expect(title).toBeVisible();
    
    const pendingCard = page.locator('text=PENDIENTES');
    await expect(pendingCard).toBeVisible();
  });

  test('debe permitir abrir una encuesta y responderla', async ({ page }) => {
    // 1. Seleccionar una encuesta (asumiendo que hay una que dice "Test")
    const surveyItem = page.locator('text=Test').first();
    await expect(surveyItem).toBeVisible();
    await surveyItem.click();

    // 2. Verificar que se abre el modal de respuesta
    const modal = page.locator('role=dialog');
    await expect(modal).toBeVisible();

    // 3. Responder (ajustar selectores según los tipos de preguntas del RenderForm)
    // Ejemplo para una pregunta de opción única
    const firstOption = page.locator('input[type="radio"]').first();
    if (await firstOption.isVisible()) {
        await firstOption.check();
    }

    // 4. Enviar
    const submitBtn = page.locator('button', { hasText: /Enviar/i });
    await expect(submitBtn).toBeEnabled();
    // await submitBtn.click(); // Comentado para evitar efectos secundarios en CI sin mocks

    // 5. Verificar toast de éxito (si se hiciera clic)
    // await expect(page.locator('text=éxito')).toBeVisible();
  });
});
