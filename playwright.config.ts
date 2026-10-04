import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const windowsChrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath=process.env.PLAYWRIGHT_CHROME_PATH??(process.platform==='win32'&&existsSync(windowsChrome)?windowsChrome:undefined);
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: false,
  use: { baseURL: process.env.TEST_BASE_URL??'http://localhost:5173', headless: true, launchOptions: { executablePath, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] } },
  reporter: 'list',
  outputDir: './outputs/browser-tests',
});
