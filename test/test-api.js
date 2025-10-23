/**
 * Simple test script for Vercel API
 * Run: node test/test-api.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_IMAGE = process.env.TEST_IMAGE || path.join(__dirname, 'test-image.jpg');

console.log('🧪 Testing Image Converter API...\n');
console.log(`API URL: ${API_URL}`);
console.log(`Test Image: ${TEST_IMAGE}\n`);

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  console.log('1️⃣ Testing Health Check...');

  return new Promise((resolve, reject) => {
    const client = API_URL.startsWith('https') ? https : http;

    client.get(`${API_URL}/api/health`, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ Health Check:', json.status);
          console.log(`   Version: ${json.version}`);
          console.log(`   Timestamp: ${json.timestamp}\n`);
          resolve(json);
        } catch (error) {
          console.error('❌ Health Check Failed:', error.message, '\n');
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('❌ Health Check Failed:', error.message, '\n');
      reject(error);
    });
  });
}

/**
 * Test 2: Image Metadata
 */
async function testMetadata() {
  console.log('2️⃣ Testing Image Metadata...');

  if (!fs.existsSync(TEST_IMAGE)) {
    console.log('⚠️  Test image not found. Skipping metadata test.\n');
    return;
  }

  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_IMAGE));

    const url = new URL(`${API_URL}/api/metadata`);
    const options = {
      method: 'POST',
      headers: form.getHeaders(),
    };

    const client = API_URL.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success) {
            console.log('✅ Metadata Retrieved:');
            console.log(`   Format: ${json.metadata.format}`);
            console.log(`   Dimensions: ${json.metadata.width}x${json.metadata.height}`);
            console.log(`   Size: ${(json.metadata.size / 1024).toFixed(2)} KB\n`);
            resolve(json);
          } else {
            console.error('❌ Metadata Failed:', json.error, '\n');
            reject(new Error(json.error));
          }
        } catch (error) {
          console.error('❌ Metadata Failed:', error.message, '\n');
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Metadata Failed:', error.message, '\n');
      reject(error);
    });

    form.pipe(req);
  });
}

/**
 * Test 3: Image Conversion
 */
async function testConversion() {
  console.log('3️⃣ Testing Image Conversion (JPEG → WebP)...');

  if (!fs.existsSync(TEST_IMAGE)) {
    console.log('⚠️  Test image not found. Skipping conversion test.\n');
    return;
  }

  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_IMAGE));
    form.append('format', 'webp');
    form.append('quality', '85');
    form.append('optimize', 'true');

    const url = new URL(`${API_URL}/api/convert`);
    const options = {
      method: 'POST',
      headers: form.getHeaders(),
    };

    const client = API_URL.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success) {
            const metadata = json.result.metadata;
            console.log('✅ Conversion Successful:');
            console.log(`   Format: ${metadata.format}`);
            console.log(`   Dimensions: ${metadata.width}x${metadata.height}`);
            console.log(`   Original Size: ${(metadata.originalSize / 1024).toFixed(2)} KB`);
            console.log(`   Converted Size: ${(metadata.size / 1024).toFixed(2)} KB`);
            console.log(`   Compression: ${metadata.compressionRatio.toFixed(2)}%\n`);
            resolve(json);
          } else {
            console.error('❌ Conversion Failed:', json.error, '\n');
            reject(new Error(json.error));
          }
        } catch (error) {
          console.error('❌ Conversion Failed:', error.message, '\n');
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Conversion Failed:', error.message, '\n');
      reject(error);
    });

    form.pipe(req);
  });
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    await testHealthCheck();
    await testMetadata();
    await testConversion();

    console.log('✨ All tests completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
