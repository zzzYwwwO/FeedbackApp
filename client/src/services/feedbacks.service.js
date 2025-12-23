import apiService from "./api.service";

export const feedbacksService = {
  async submitFeedback(body) {
    try {
      const response = await apiService.post("/feedback", body);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(
        error.response?.data?.message || "אירעה שגיאה בשליחת המשוב"
      );
    }
  },

  async fetchStats() {
    try {
      const response = await apiService.get("/feedback/stats");
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(
        error.response?.data?.message || "שגיאה בקבלת הסטיסטיקות"
      );
    }
  },

  async fetchFeedbacks(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        rating = null,
        filter = "all",
        sortBy = "date",
        isReply = null,
      } = options;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
      });

      if (search) params.append("search", search);
      if (rating) params.append("rating", rating.toString());
      if (filter !== "all") params.append("filter", filter);
      if (isReply !== null) params.append("isReply", isReply);

      const response = await apiService.get(
        `/feedback/feedbacks?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(error.response?.data?.message || "שגיאה בקבלת המשובים");
    }
  },

  async fetchFeedback(feedbackId) {
    try {
      const response = await apiService.get(
        `/feedback/feedback?id=${feedbackId.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(error.response?.data?.message || "接受反馈出错");
    }
  },

  // 根据名字查这个用户的所有反馈信息； 反馈页面的dialog显示
  async fetchFeedbackByName(name) {
    try {
      const response = await apiService.get(
        `/feedback/feedbackbyname?name=${name}`
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(error.response?.data?.message || "接受反馈出错");
    }
  },

  // 根据id回复用户
  async replyFeedback(id, reply) {
    try {
      const response = await apiService.post(`/feedback/reply/${id}`, {
        reply,
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(error.response?.data?.message || "回复反馈出错");
    }
  },

  async deleteFeedback(id) {
    try {
      const response = await apiService.delete(`/feedback/${id}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(error.response?.data?.message || "删除操作反馈出错");
    }
  },
};
