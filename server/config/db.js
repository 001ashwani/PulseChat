import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Optional: Do not exit process if you want the server to run anyway (e.g. for development without DB)
    // process.exit(1); 
  }
};

export default connectDB;
