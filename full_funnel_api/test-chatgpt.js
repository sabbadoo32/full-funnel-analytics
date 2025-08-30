require('dotenv').config();
const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const Campaign = require('./models/Campaign');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function for OpenAI API calls with enhanced error handling
async function callOpenAIWithErrorHandling(messages, model = 'gpt-4') {
  try {
    return await openai.chat.completions.create({
      model: model,
      messages: messages
    });
  } catch (error) {
    // Log detailed error information
    console.error('OpenAI API error details:', {
      name: error.name,
      message: error.message,
      type: error.constructor.name,
      status: error.status || 'unknown',
      headers: error.headers || 'none',
      code: error.code || 'none'
    });
    
    // Handle ClientResponseError or network-related errors
    if (error.name === 'ClientResponseError' || 
        error.message?.includes('network') || 
        error.message?.includes('timeout') || 
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT')) {
      console.error('Network or ClientResponseError detected:', error.message);
      
      // Retry with fallback model
      if (model === 'gpt-4') {
        console.log('Retrying with gpt-3.5-turbo due to network error');
        return callOpenAIWithErrorHandling(messages, 'gpt-3.5-turbo');
      }
    }
    
    // Re-throw the error for the caller to handle
    throw error;
  }
}

async function testChatGPT() {
  try {
    // Test OpenAI connection
    console.log('Testing ChatGPT connection...');
    const completion = await callOpenAIWithErrorHandling([
      { role: "user", content: "Say 'MongoDB connection is working!'" }
    ]);
    console.log('ChatGPT Response:', completion.choices[0].message.content);
    
    // Test MongoDB + ChatGPT
    console.log('\nTesting MongoDB + ChatGPT integration...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Get campaign count
    const campaignCount = await Campaign.countDocuments();
    
    // Ask ChatGPT about the campaigns
    const prompt = `There are ${campaignCount} campaigns in the database. Please provide a brief analysis.`;
    const analysis = await callOpenAIWithErrorHandling([
      { role: "user", content: prompt }
    ]);
    
    console.log('Analysis:', analysis.choices[0].message.content);
    
  } catch (error) {
    console.error('Error in testChatGPT:', error.message);
    if (error.name === 'ClientResponseError') {
      console.error('ClientResponseError detected. This may be due to network issues or API rate limits.');
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('\nMongoDB connection closed.');
    }
    console.log('Test completed.');
  }
}

testChatGPT();
