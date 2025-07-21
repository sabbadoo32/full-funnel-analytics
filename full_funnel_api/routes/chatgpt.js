const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const Campaign = require('../models/Campaign');

const openai = new OpenAI({
    apiKey: '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'
});

router.post('/query', async (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        // First, get campaign data from MongoDB
        const campaigns = await Campaign.find({});

        // Format the data for ChatGPT
        const formattedData = campaigns.map(campaign => ({
            campaignTag: campaign['Campaign Tag'],
            date: campaign.Date,
            metrics: {
                emailsSent: campaign['Emails Sent'],
                opened: campaign.Opened,
                clicked: campaign.Clicked,
                converted: campaign.Converted,
                gaSessions: campaign['GA Sessions'],
                fbReach: campaign['FB Reach'],
                igClicks: campaign['IG Clicks'],
                mobilizeRSVPs: campaign['Mobilize RSVPs']
            }
        }));

        // Create ChatGPT prompt
        const prompt = `Analyze the following campaign data and answer this question: ${query}\n\nCampaign Data:\n${JSON.stringify(formattedData, null, 2)}`;

        // Get response from ChatGPT
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a campaign analytics expert. Analyze campaign data and provide insights based on the metrics provided. Use specific numbers and percentages when possible. Format your response in markdown."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        // Send response
        res.json({
            analysis: completion.choices[0].message.content,
            data: formattedData
        });

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

module.exports = router;
