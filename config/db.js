import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || "mongodb+srv://ambanikushwaha88_db_user:9V59bLy0GpdQQ8zd@firstcluster.trty8xa.mongodb.net/internbridge";

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database Warning] MongoDB disconnected. Attempting reconnect...');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database Error] Runtime connection error: ${err.message}`);
  });
};
