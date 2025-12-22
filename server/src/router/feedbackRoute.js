import express from "express";
import FeedbackController from "../controllers/FeedbackController.js";
// import authToken from '../middleware/authToken.js';
const router = express.Router();

console.log("router");

// 删除authToken中间件，允许所有用户访问
// Get all feedbacks (admin only)
router.get("/feedbacks", FeedbackController.getFeedbacks);
// Get single feedbacks (admin only)
router.get("/feedback", FeedbackController.getFeedback);
// Create new feedback
router.post("/", FeedbackController.createFeedback);
// Get feedback statistics
router.get("/stats", FeedbackController.getFeedbacksStat);
// Delete feedback (admin only)
router.delete("/:id", FeedbackController.deleteFeedback);

export default router;
