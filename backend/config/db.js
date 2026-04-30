import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://nooulhuda222_db_user:noorulhuda5258325@cluster0.q344m1t.mongodb.net/MediCare"
    );

    console.log("DB CONNECTED");
  } catch (error) {
    console.log("MongoDB Error:", error.message);
  }
};
 