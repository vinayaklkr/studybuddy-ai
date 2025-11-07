// Test script to list available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log('Testing API Key:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');
    console.log('\nAttempting to list models...\n');

    // Try listing models
    const models = await genAI.listModels();

    console.log('Available models:');
    for await (const model of models) {
      console.log('- ', model.name);
      console.log('  Display Name:', model.displayName);
      console.log('  Supported Methods:', model.supportedGenerationMethods);
      console.log('');
    }
  } catch (error) {
    console.error('Error listing models:', error.message);
    console.log('\nTrying common model names...\n');

    // Try different model names
    const modelsToTry = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'models/gemini-pro',
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "Hello"');
        const response = await result.response;
        console.log(`✓ ${modelName} works! Response:`, response.text().substring(0, 50));
      } catch (err) {
        console.log(`✗ ${modelName} failed:`, err.message.split('\n')[0]);
      }
    }
  }
}

listModels();
