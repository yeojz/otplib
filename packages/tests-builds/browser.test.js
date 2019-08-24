import puppeteer from 'puppeteer';
import path from 'path';
import { testSuitePreset } from 'tests-suites/preset';
import * as dataAuthenticator from 'tests-data/authenticator';
import * as otplib from '../../builds/otplib/preset-browser';

testSuitePreset('[builds] preset-browser', otplib);

const browserOpt = (() => {
  const opt = {};

  opt.headless = !(process.env.OTPLIB_TEST_BROWSER_DISPLAY === 'true');

  if (process.env.GITHUB_ACTION) {
    console.log('Adding extra browser arguments...');

    opt.headless = true;
    opt.executablePath = 'google-chrome-unstable';
    opt.args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ];
  }

  console.log(opt);

  return opt;
})();

describe('browser console', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch(browserOpt);

    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await page.goto(`file:${path.join(__dirname, 'browser.html')}`);
  });

  dataAuthenticator.table.forEach(entry => {
    test(`given same secret, epoch ${entry.epoch}, receive same token (${entry.token})`, async () => {
      const result = await page.evaluate(
        (epoch, secret) => {
          window.otplib.authenticator.options = { epoch };
          return window.otplib.authenticator.generate(secret);
        },
        entry.epoch,
        entry.secret
      );

      expect(result).toBe(entry.token);
    });
  });
});
