const mongoose = require('mongoose');

async function testConnection() {
  const uri = 'mongodb+srv://sebastianjames:d%402119ChartwellDrive@cluster0.gh4va.mongodb.net/';
  
  try {
    console.log('Attempting connection...');
    await mongoose.connect(uri);
    console.log('Connected successfully!');
    
    const dbs = await mongoose.connection.db.admin().listDatabases();
    console.log('Available databases:', dbs.databases.map(db => db.name));
    
    await mongoose.connection.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Connection error:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
