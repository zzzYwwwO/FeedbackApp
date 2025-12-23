import Feedback from "../../config/models/feedback.js";

class FeedbackModel {
  constructor() {}

  static async getFeedbacks(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      rating = null,
      filter = "all",
      sortBy = "date",
      isReply = null,
    } = options;

    // Build query object
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    // Rating filter
    if (rating) {
      query.rating = rating;
    }

    // Active filter
    if (filter === "positive") {
      query.rating = { $gte: 4 };
    } else if (filter === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.createdAt = { $gte: weekAgo };
    }

    // Sort object
    let sort = {};
    if (sortBy === "date") {
      sort.createdAt = -1;
    } else if (sortBy === "rating") {
      sort.rating = -1;
    } else if (sortBy === "name") {
      sort.name = 1;
    }

    if (isReply !== null) query.isReply = isReply;

    // Calculate skip value
    const skip = (page - 1) * limit;

    console.log("query", query);

    // Execute queries in parallel
    const [feedbacks, totalCount] = await Promise.all([
      Feedback.find(query).sort(sort).skip(skip).limit(limit),
      Feedback.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      feedbacks,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    };
  }

  static async getFeedback(id) {
    return await Feedback.findById(id);
  }

  static async getFeedbackByName(name) {
    // name即userid
    return await Feedback.find({ name: name });
  }

  // 回复用户
  static async replyFeedback(id, reply) {
    // 核心：findByIdAndUpdate（有则更新，无则提示）
    // 参数1：查询条件（_id）
    // 参数2：要更新的字段（$set 表示新增/更新字段，不会覆盖其他字段）
    // 参数3：配置项（new: true 返回更新后的数据，runValidators: true 触发模型校验）
    return await Feedback.findByIdAndUpdate(
      id,
      { $set: { reply, isReply: true } },
      { new: true, runValidators: true }
    );
  }

  static async createFeedback(newFeedback) {
    return await Feedback.create(newFeedback);
  }

  static async getFeedbacksStat() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalFeedbacks, ratingStats, positiveFeedbacks, weeklyFeedbacks] =
      await Promise.all([
        Feedback.countDocuments(),

        Feedback.aggregate([
          {
            $group: {
              _id: null,
              averageRating: { $avg: "$rating" },
              totalRatings: { $sum: 1 },
            },
          },
        ]),
        Feedback.countDocuments({ rating: { $gte: 4 } }),

        Feedback.countDocuments({
          createdAt: { $gte: weekAgo },
        }),
      ]);

    return {
      total: totalFeedbacks,
      averageRating: ratingStats[0]?.averageRating?.toFixed(1) || "0",
      positive: positiveFeedbacks,
      weekly: weeklyFeedbacks,
    };
  }

  static async deleteFeedback(feedbackId) {
    const deletedFeedback = await Feedback.findByIdAndDelete(feedbackId);
    if (!deletedFeedback) {
      return false;
    }
    return true;
  }

  // static async findById(_id) {

  //   const user = await Users.findById(_id);

  //   return user;

  // }
}

export default FeedbackModel;
