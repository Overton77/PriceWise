import mongoose from "mongoose";

let isConnected = false; // Variable to track the connection status

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGO_URI) return console.log("MongoDB URI is not defined");

  if (isConnected) return console.log("=> using existing connection");

  try {
    await mongoose.connect(process.env.MONGO_URI);

    isConnected = true;

    console.log("MONGO DB CONNECTED");
  } catch (err) {
    console.log(err);
  }
};
