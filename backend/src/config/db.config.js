const mongoose = require("mongoose");

exports.ConnectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`DB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("Database connection error:");
    console.error(error.message); // 👈 show real error
    process.exit(1);
  }
};