import mongoose from 'mongoose';

const ConnectDB = async()=>{
  try {
    const conn = await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}`);
    console.log(`MongoDB connected: successfully`);
  } catch (error) {
 console.error("MongoDB connection failed:", error.message);
    process.exit(1);  }
}

export default ConnectDB;