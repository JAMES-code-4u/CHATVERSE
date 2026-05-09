require('dotenv').config();
const mongoose = require('mongoose');

console.log("Attempting to connect to MongoDB...");
console.log("URI:", process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@')); // Hide password

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Success! Connected to MongoDB.");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Connection failed!");
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    process.exit(1);
  });
