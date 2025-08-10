const TestHelpers = require('../utils/test-helpers');

describe('Autenticación de usuarios', () => {
  let driver;
  let helpers;

  beforeAll(() => {
    driver = global.getDriver();
    helpers = new TestHelpers(driver);
  });

  beforeEach(async () => {
    await helpers.navigateTo('/');
    await helpers.waitForPageLoad();
  });


  test('Usuario puede registrarse exitosamente', async () => {
    const testEmail = helpers.generateTestEmail();
    
    await helpers.navigateTo('/register');
    
    // Usar IDs exactos de tu register/page.tsx
    await helpers.typeText('#email', testEmail);
    await helpers.typeText('#password', 'password123');
    await helpers.typeText('#confirmPassword', 'password123');
    
    await helpers.clickElement('button[type="submit"]');
    
    // Según tu código, después del registro exitoso muestra mensaje de éxito
    // y redirige a login, no directamente al dashboard
    await helpers.waitForText('h2', '¡Cuenta creada!', 25000);
    
    // Verificar que muestra el mensaje de éxito
    const successMessage = await helpers.elementExists('.text-green-600');
    expect(successMessage).toBe(true);
  }, 30000);


  test('Validación de contraseñas no coinciden funciona', async () => {
    await helpers.navigateTo('/register');
    
    await helpers.typeText('#email', 'test@example.com');
    await helpers.typeText('#password', 'password123');
    await helpers.typeText('#confirmPassword', 'diferente123');
    
    await helpers.clickElement('button[type="submit"]');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Buscar mensaje específico de tu validación zod
    const errorText = await helpers.getElementText('p.text-sm.text-red-500');
    expect(errorText).toContain('no coinciden');
  });

  test('Login funciona correctamente', async () => {
    // Primero registrar usuario y esperar a que se complete
    const testEmail = helpers.generateTestEmail();
    await helpers.navigateTo('/register');
    
    await helpers.typeText('#email', testEmail);
    await helpers.typeText('#password', 'password123');
    await helpers.typeText('#confirmPassword', 'password123');
    await helpers.clickElement('button[type="submit"]');
    
    // Esperar mensaje de cuenta creada
    await helpers.waitForText('h2', '¡Cuenta creada!', 20000);
    
    // Tu app redirige automáticamente al login después de 2 segundos
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Ahora hacer login
    await helpers.typeText('#email', testEmail);
    await helpers.typeText('#password', 'password123');
    await helpers.clickElement('button[type="submit"]');
    
    // Verificar redirección al dashboard
    await helpers.waitForURL('/app', 20000);
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/app');
  }, 50000);

});