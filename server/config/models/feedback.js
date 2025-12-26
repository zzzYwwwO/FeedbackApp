import mongoose from "mongoose";

const messageItemSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      enum: ["user", "admin"],
      trim: true,
    },
    msg: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Feedback Schema
const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
    },
    message: {
      type: [messageItemSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
Feedback.syncIndexes();

export default Feedback;
