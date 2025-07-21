require('dotenv').config();
const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const Campaign = require('./models/Campaign');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testChatGPT() {
  try {
    // Test OpenAI connection
    console.log('Testing ChatGPT connection...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Say 'MongoDB connection is working!'" }],
    });
    console.log('ChatGPT Response:', completion.choices[0].message.content);
    
    // Test MongoDB + ChatGPT
    console.log('\nTesting MongoDB + ChatGPT integration...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Get campaign count
    const campaignCount = await Campaign.countDocuments();
    
    // Ask ChatGPT about the campaigns
    const prompt = `There are ${campaignCount} campaigns in the database. Please provide a brief analysis.`;
    const analysis = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });
    
    console.log('Analysis:', analysis.choices[0].message.content);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnections closed.');
  }
}

testChatGPT();
