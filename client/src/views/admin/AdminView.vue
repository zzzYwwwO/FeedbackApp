<template>
  <v-container class="grey-lighten-5 min-h-screen">
    <v-row justify="center">
      <v-col cols="12" md="10">
        <!-- Header -->
        <v-row class="mb-6" justify="space-between">
          <v-col cols="auto" class="text-start">
            <h1 class="text-h4 font-weight-bold">反馈管理面板</h1>
            <p class="text-subtitle-1 text-grey-darken-1">管理和查看客户反馈</p>
          </v-col>
          <v-col cols="auto" class="text-start">
            <v-btn color="primary" @click="refreshData" :loading="refreshing">
              <v-icon start>mdi-refresh</v-icon>
              刷新
            </v-btn>
          </v-col>
        </v-row>

        <!-- Filters and Search -->
        <v-card class="mb-4">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="searchQuery"
                  label="搜索userId"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                ></v-text-field>
              </v-col>

              <!-- <v-col cols="12" md="2">
                <v-btn
                  color="error"
                  variant="outlined"
                  @click="clearFilters"
                  block
                >
                  清除筛选
                </v-btn>
              </v-col> -->
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Feedbacks List -->
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>反馈列表 ({{ feedbacks.length }})</span>
            <v-chip
              v-if="activeFilter !== 'all'"
              color="primary"
              variant="flat"
              closable
              @click:close="clearFilters"
            >
              {{ getFilterLabel(activeFilter) }}
            </v-chip>

            <!-- Items per page selector -->
            <div class="d-flex justify-space-between align-center">
              <div class="d-flex align-center mr-2">
                <span class="text-body-2 text-grey-darken-1 mr-3"
                  >每页项目数</span
                >
                <v-select
                  v-model="itemsPerPage"
                  :items="itemsPerPageOptions"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="max-width: 100px"
                  @update:modelValue="fetchFeedbacks"
                ></v-select>
              </div>
              <div class="text-body-2 text-grey-darken-1 mr-4">
                {{ displayInfo }}
              </div>
            </div>
          </v-card-title>

          <v-card-text>
            <v-row v-if="loading" justify="center" class="py-8">
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
              <div class="ms-4">正在加载反馈...</div>
            </v-row>

            <div v-else-if="feedbacks.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1"
                >mdi-message-text-outline</v-icon
              >
              <div class="text-h6 text-grey-darken-1 mt-4">
                {{ searchQuery ? "未找到匹配的反馈" : "暂无反馈" }}
              </div>
            </div>

            <div v-else class="feedback-list">
              <v-card
                v-for="feedback in paginatedFeedbacks"
                :key="feedback._id"
                class="mb-4 feedback-card"
                variant="outlined"
                @click="viewFeedbackDetail(feedback)"
              >
                <v-card-text class="pa-4">
                  <div class="d-flex justify-space-between align-start mb-3">
                    <div class="d-flex align-center">
                      <v-avatar color="blue-lighten-1" class="me-3">
                        <v-icon color="white">mdi-account</v-icon>
                      </v-avatar>
                      <div>
                        <div class="text-h6 font-weight-medium">
                          {{ feedback.userId }}
                        </div>
                        <div class="text-caption text-grey-darken-1">
                          {{ formatDate(feedback.createdAt) }}
                        </div>
                      </div>
                    </div>

                    <div class="d-flex align-center">
                      <v-menu>
                        <template v-slot:activator="{ props }">
                          <v-btn
                            icon="mdi-dots-vertical"
                            variant="text"
                            size="small"
                            v-bind="props"
                            @click.stop
                          ></v-btn>
                        </template>
                        <v-list>
                          <v-list-item @click="viewFeedbackDetail(feedback)">
                            <template v-slot:prepend>
                              <v-icon>mdi-eye</v-icon>
                            </template>
                            <v-list-item-title>查看详情</v-list-item-title>
                          </v-list-item>
                          <v-list-item @click="deleteFeedback(feedback._id)">
                            <template v-slot:prepend>
                              <v-icon color="error">mdi-delete</v-icon>
                            </template>
                            <v-list-item-title>删除</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </div>
                  </div>

                  <div style="max-height: 10vh; overflow-y: auto">
                    <div v-for="item in feedback.message">
                      {{ item.role + ":  " + truncateMessage(item.msg) }}
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- Pagination Controls -->
            <div v-if="totalPagesComputed > 1" class="mt-6">
              <div class="text-center mt-4">
                <v-pagination
                  v-model="currentPage"
                  :length="totalPagesComputed"
                  :total-visible="7"
                  :disabled="serverLoading"
                  show-first-last-page
                ></v-pagination>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <SnackBar
      v-model="snackbar.show"
      :snacbarText="snackbar.text"
      :snackbarColorBt="snackbar.color"
    ></SnackBar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive } from "vue";
import { useRouter } from "vue-router";
import { feedbacksService } from "@/services/feedbacks.service";
import SnackBar from "@/components/widgets/snackBar.vue";

const router = useRouter();

const feedbacks = ref([]);
const loading = ref(true);
const refreshing = ref(false);
const sortBy = ref("date");
const searchQuery = ref("");
const filterRating = ref(null);
const activeFilter = ref("all");
const currentPage = ref(1);
const itemsPerPage = ref(10);
const isReply = ref(null);

const totalCount = ref(0);
const totalPages = ref(0);
const hasNextPage = ref(false);
const hasPrevPage = ref(false);
const serverLoading = ref(false);

const snackbar = reactive({
  show: false,
  text: "",
  color: "green",
});

// Sort and filter options
const sortOptions = [
  { title: "按日期排序", value: "date" },
  { title: "按评分排序", value: "rating" },
  { title: "按姓名排序", value: "name" },
];

const ratingFilterOptions = [
  { title: "所有评分", value: null },
  { title: "5星", value: 5 },
  { title: "4星", value: 4 },
  { title: "3星", value: 3 },
  { title: "2星", value: 2 },
  { title: "1星", value: 1 },
];

const isReplyOpt = [
  { title: "已回复", value: true },
  { title: "未回复", value: false },
];

const itemsPerPageOptions = [10, 20, 50, 100];

onMounted(() => {
  fetchFeedbacks();
});

const displayInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(
    currentPage.value * itemsPerPage.value,
    totalCount.value
  );
  return `显示 ${start}-${end} 条，共 ${totalCount.value} 条反馈`;
});

const averageRating = computed(() => {
  if (feedbacks.value.length === 0) return "0";
  const sum = feedbacks.value.reduce(
    (acc, feedback) => acc + feedback.rating,
    0
  );
  return (sum / feedbacks.value.length).toFixed(1);
});

const positiveFeedbacks = computed(() => {
  return feedbacks.value.filter((feedback) => feedback.rating >= 4).length;
});

const weeklyFeedbacks = computed(() => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return feedbacks.value.filter(
    (feedback) => new Date(feedback.createdAt) > weekAgo
  ).length;
});

// Watch for filter changes to reset pagination
watch([searchQuery, filterRating, activeFilter, sortBy, isReply], () => {
  currentPage.value = 1;
  fetchFeedbacks();
});

// Watch for currentPage changes to reset pagination
watch([currentPage], () => {
  fetchFeedbacks();
});

// Remove old computed properties and update
const paginatedFeedbacks = computed(() => {
  // Now feedbacks.value already contains only the items of the current page
  return feedbacks.value;
});

// Update totalPages to use data from the server
const totalPagesComputed = computed(() => {
  return totalPages.value;
});

const fetchFeedbacks = async () => {
  try {
    const options = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value,
      rating: filterRating.value,
      filter: activeFilter.value,
      sortBy: sortBy.value,
      isReply: isReply.value,
    };

    const response = await feedbacksService.fetchFeedbacks(options);
    // Update data from the server
    feedbacks.value = response.feedbacks;
    totalCount.value = response.pagination.totalCount;
    totalPages.value = response.pagination.totalPages;
    hasNextPage.value = response.pagination.hasNextPage;
    hasPrevPage.value = response.pagination.hasPrevPage;
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const refreshData = async () => {
  refreshing.value = true;
  await fetchFeedbacks();
};

const filterBy = (filter) => {
  activeFilter.value = filter;
  currentPage.value = 1;
  fetchFeedbacks();
};

const clearFilters = () => {
  searchQuery.value = "";
  filterRating.value = null;
  activeFilter.value = "all";
  currentPage.value = 1;
  isReply.value = null;
};

const getFilterLabel = (filter) => {
  const labels = {
    positive: "正面反馈",
    weekly: "本周",
    all: "全部",
  };
  return labels[filter] || filter;
};

const getRatingColor = (rating) => {
  if (rating >= 4) return "green";
  if (rating >= 3) return "amber";
  return "red";
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const showSnackbar = (text, color) => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

const truncateMessage = (message, length = 100) => {
  return message.length > length
    ? message.substring(0, length) + "..."
    : message;
};

const viewFeedbackDetail = (feedback) => {
  router.push({
    name: "FeedbackDetail",
    params: { id: feedback._id },
  });
};

const deleteFeedback = async (id) => {
  if (confirm("您确定要删除此反馈吗？")) {
    try {
      await feedbacksService.deleteFeedback(id);
      await fetchFeedbacks();
      showSnackbar("反馈删除成功！", "green");
    } catch (error) {
      showSnackbar("删除反馈时发生错误", "red");
      console.error("Error deleting feedback:", error);
    }
  }
};
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}

.feedback-card {
  border-right: 4px solid #2196f3 !important;
  transition: transform 0.2s ease-in-out;
  cursor: pointer;
}

.feedback-card:hover {
  transform: translateY(-2px);
}

.feedback-list {
  max-height: none;
}
</style>
