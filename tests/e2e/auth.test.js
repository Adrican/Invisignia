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
    
    await helpers.typeText('#email', testEmail);
    await helpers.typeText('#password', 'password123');
    await helpers.typeText('#confirmPassword', 'password123');
    
    await helpers.clickElement('button[type="submit"]');
    
    await helpers.waitForText('h2', '¡Cuenta creada!', 25000);
    
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
    
    const errorText = await helpers.getElementText('p.text-sm.text-red-500');
    expect(errorText).toContain('no coinciden');
  });

  test('Login funciona correctamente', async () => {
    const testEmail = helpers.generateTestEmail();
    await helpers.navigateTo('/register');
    
    await helpers.typeText('#email', testEmail);
    await helpers.typeText('#password', 'password123');
    await helpers.typeText('#confirmPassword', 'password123');
    await helpers.clickElement('button[type="submit"]');
    
    await helpers.waitForText('h2', '¡Cuenta creada!', 20000);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await helpers.typeText('#email', testEmail);
    await helpers.typeText('#password', 'password123');
    await helpers.clickElement('button[type="submit"]');
    
    await helpers.waitForURL('/app', 20000);
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/app');
  }, 50000);

});