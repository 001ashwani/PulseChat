import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async (retries = 5) => {
  try {
    const mongooseOptions = {
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    if (retries > 0) {
      logger.info(`Retrying connection (${retries} attempts remaining)...`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
      return connectDB(retries - 1);
    }

    logger.error('Failed to connect to MongoDB after retries. Exiting...');
    process.exit(1);
  }
};

export default connectDB;

