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
// 根据useid（name） 查询用户的所有反馈历史
router.get("/feedbackbyname", FeedbackController.getFeedbackByName);
// Create new feedback
router.post("/", FeedbackController.createFeedback);
// Get feedback statistics
router.get("/stats", FeedbackController.getFeedbacksStat);
// 根据id回复用户
router.post("/reply/:id", FeedbackController.replyFeedback);
// Delete feedback (admin only)
router.delete("/:id", FeedbackController.deleteFeedback);

export default router;
