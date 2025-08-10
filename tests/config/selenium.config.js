const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

let driver;

global.getDriver = () => {
  if (!driver) {
    const options = new chrome.Options();
    
    if (process.env.NODE_ENV !== 'ci') {
      options.addArguments('--start-maximized');
      options.addArguments('--disable-web-security');
      options.addArguments('--allow-running-insecure-content');
    } else {
      options.addArguments('--headless');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
    }
    
    driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }
  return driver;
};

global.closeDriver = async () => {
  if (driver) {
    await driver.quit();
    driver = null;
  }
};

afterAll(async () => {
  await global.closeDriver();
});