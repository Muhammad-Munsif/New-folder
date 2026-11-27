const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`, {
      cause: error,
    });
  }
};

module.exports = connectDB;
