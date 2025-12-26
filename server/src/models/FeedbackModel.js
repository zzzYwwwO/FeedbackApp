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
      query = { userId: { $regex: search, $options: "i" } };
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
    return await Feedback.find({ userId: name });
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
    const { name, message } = newFeedback;
    return await Feedback.findOneAndUpdate(
      { userId: name },
      { $push: { message: message } }, // 像message字段追加数据message
      {
        upsert: true, // 无匹配文档则创建,有就更新！
        new: true, // 返回更新后的文档（而非更新前）
        runValidators: true, // 执行 Schema 校验（确保 newMessage 符合规则）
        setDefaultsOnInsert: true, // 插入新文档时应用默认值（如 timestamps）
      }
    );
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
}

export default FeedbackModel;
