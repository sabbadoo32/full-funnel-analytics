const https = require('https');

exports.handler = async function(event, context) {
  try {
    const ip = await new Promise((resolve, reject) => {
      https.get('https://api.ipify.org?format=json', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data).ip));
        res.on('error', reject);
      }).on('error', reject);
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ip,
        headers: event.headers,
        clientIp: event.headers['client-ip'],
        sourceIp: event.headers['x-forwarded-for']
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
