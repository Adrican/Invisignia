const { By, until } = require('selenium-webdriver');
const path = require('path');

class TestHelpers {
  constructor(driver) {
    this.driver = driver;
    this.baseURL = 'http://localhost:3000';
  }

  async navigateTo(path = '') {
    await this.driver.get(`${this.baseURL}${path}`);
    await this.driver.wait(until.elementLocated(By.tagName('body')), 15000);
  }

  async waitForElement(selector, timeout = 15000) {
    let locator;
    
    if (selector.includes('[') && selector.includes(']')) {
      locator = By.css(selector);
    } else if (selector.startsWith('#')) {
      locator = By.id(selector.substring(1));
    } else if (selector.startsWith('.')) {
      // Para clases múltiples como 'p.text-sm.text-red-500'
      locator = By.css(selector);
    } else {
      locator = By.css(selector);
    }
    
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async clickElement(selector) {
    const element = await this.waitForElement(selector);
    await this.driver.wait(until.elementIsEnabled(element), 8000);
    await this.driver.wait(until.elementIsVisible(element), 8000);
    
    // Scroll al elemento
    await this.driver.executeScript("arguments[0].scrollIntoView(true);", element);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await element.click();
  }

  async typeText(selector, text) {
    const element = await this.waitForElement(selector);
    await element.clear();
    await new Promise(resolve => setTimeout(resolve, 200));
    await element.sendKeys(text);
    
    // Verificar que el texto se escribió correctamente
    const value = await element.getAttribute('value');
    if (value !== text) {
      console.warn(`Expected "${text}" but got "${value}" for selector ${selector}`);
    }
  }

  async uploadFile(selector, filename) {
    const filePath = path.join(__dirname, '../fixtures', filename);
    const element = await this.waitForElement(selector);
    await element.sendKeys(filePath);
  }

  async waitForText(selector, text, timeout = 15000) {
    const element = await this.waitForElement(selector);
    await this.driver.wait(until.elementTextContains(element, text), timeout);
  }

  async elementExists(selector) {
    try {
      await this.waitForElement(selector, 3000);
      return true;
    } catch {
      return false;
    }
  }

  async getElementText(selector) {
    const element = await this.waitForElement(selector);
    return await element.getText();
  }

  async waitForURL(expectedURL, timeout = 25000) {
    await this.driver.wait(until.urlContains(expectedURL), timeout);
  }

  async registerUser(email, password) {
    await this.navigateTo('/register');
    await this.typeText('#email', email);
    await this.typeText('#password', password);
    await this.typeText('#confirmPassword', password);
    await this.clickElement('button[type="submit"]');
  }

  async loginUser(email, password) {
    await this.navigateTo('/login');
    await this.typeText('#email', email);
    await this.typeText('#password', password);
    await this.clickElement('button[type="submit"]');
  }

  generateTestEmail() {
    return `test${Date.now()}@example.com`;
  }

  async waitForPageLoad() {
    await this.driver.wait(
      async () => {
        const readyState = await this.driver.executeScript('return document.readyState');
        return readyState === 'complete';
      },
      15000
    );
    
    // Esperar más tiempo para Next.js
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  async takeScreenshot(filename) {
    const screenshot = await this.driver.takeScreenshot();
    const fs = require('fs');
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }
    fs.writeFileSync(`screenshots/${filename}.png`, screenshot, 'base64');
  }

  // Debug helper para ver qué elementos existen en la página
  async debugPageElements() {
    const inputs = await this.driver.findElements(By.css('input'));
    const buttons = await this.driver.findElements(By.css('button'));
    const h1s = await this.driver.findElements(By.css('h1'));
    
    console.log('Found inputs:', inputs.length);
    console.log('Found buttons:', buttons.length);
    console.log('Found h1s:', h1s.length);
    
    // Log IDs de inputs
    for (let input of inputs) {
      const id = await input.getAttribute('id');
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`Input - ID: ${id}, Type: ${type}, Placeholder: ${placeholder}`);
    }
    
    // Log texto de h1s
    for (let h1 of h1s) {
      const text = await h1.getText();
      console.log(`H1 text: ${text}`);
    }
  }
}

module.exports = TestHelpers;

// Añadir este test temporal al principio para debug
test('DEBUG: Verificar elementos en página de registro', async () => {
  await helpers.navigateTo('/register');
  await helpers.waitForPageLoad();
  
  console.log('=== DEBUG INFO ===');
  await helpers.debugPageElements();
  
  const url = await driver.getCurrentUrl();
  console.log('Current URL:', url);
  
  const title = await driver.getTitle();
  console.log('Page title:', title);
  
  await helpers.takeScreenshot('debug-register-page');
  
  // Este test siempre pasa, solo es para debug
  expect(true).toBe(true);
});