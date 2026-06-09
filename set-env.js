const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const targetPath = path.resolve(__dirname, 'src/assets/env.js');

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    console.warn('.env file not found. Skipping environment sync.');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  const envVars = {};

  envLines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...values] = trimmedLine.split('=');
      if (key && values.length > 0) {
        const value = values.join('=').trim();
        envVars[key.trim()] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  });

  if (envVars.API_BASE_URL && !envVars.apiBaseUrl) {
    envVars.apiBaseUrl = envVars.API_BASE_URL;
  }
  if (envVars.apiBaseUrl && !envVars.API_BASE_URL) {
    envVars.API_BASE_URL = envVars.apiBaseUrl;
  }

  const content = `(function(window) {
  window.__env = window.__env || {};
${Object.entries(envVars)
  .map(([key, value]) => `  window.__env.${key} = '${value}';`)
  .join('\n')}
})(this);
`;

  fs.writeFileSync(targetPath, content);
  console.log(`Environment variables synced to ${targetPath}`);
}

loadEnv();
