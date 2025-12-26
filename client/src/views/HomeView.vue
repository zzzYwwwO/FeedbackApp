<template>
  <div class="gradient-bg min-h-screen">
    <v-container fluid class="pa-0" height="100vh">
      <v-row no-gutters class="fill-height">
        <v-col cols="12" class="d-flex align-center justify-center">
          <div class="w-100">
            <v-container class="py-4 py-sm-8">
              <v-row justify="center">
                <v-col cols="12" sm="10" md="8" lg="6">
                  <!-- Header -->
                  <div class="text-center mb-4 mb-sm-8">
                    <h1
                      class="text-h4 text-sm-h3 font-weight-bold text-white mb-2"
                    >
                      SoulTalk
                    </h1>
                    <p class="text-body-1 text-sm-h6 text-blue-lighten-1">
                      We're happy to hear your feedback
                    </p>
                  </div>

                  <!-- Feedback Card -->
                  <v-card class="elevation-8 rounded-lg">
                    <div
                      class="d-flex justify-end pa-2 pa-sm-4"
                      @click="openMailboxDislog"
                    >
                      <v-icon size="large" color="red" end
                        >mdi-message-bulleted</v-icon
                      >
                    </div>

                    <v-card-title class="text-center pa-4 pa-sm-6">
                      <v-icon class="me-2" color="primary"
                        >mdi-message-text</v-icon
                      >
                      <span class="text-h6 text-sm-h5">Feedback Form</span>
                    </v-card-title>
                    <v-card-subtitle class="text-center pb-2 pb-sm-4">
                      Click the top right corner to view replies
                    </v-card-subtitle>

                    <v-card-text class="pa-4 pa-sm-6">
                      <v-form
                        ref="form"
                        v-model="valid"
                        @submit.prevent="handleSubmitFeedback"
                        class="text-start"
                      >
                        <v-text-field
                          v-model="userId"
                          readonly=""
                          prepend-inner-icon="mdi-account"
                          variant="outlined"
                          :rules="nameRules"
                          required
                          class="mb-3 mb-sm-4 text-start"
                        ></v-text-field>

                        <v-textarea
                          v-model="feedback.message"
                          label="Message"
                          prepend-inner-icon="mdi-message"
                          variant="outlined"
                          :rules="messageRules"
                          rows="4"
                          required
                          class="mb-3 mb-sm-4 text-start"
                        ></v-textarea>

                        <v-btn
                          type="submit"
                          color="primary"
                          size="large"
                          block
                          :loading="loading"
                          :disabled="!valid"
                          class="mb-3 mb-sm-4"
                        >
                          <v-icon start>mdi-send</v-icon>
                          Submit Feedback
                        </v-btn>
                      </v-form>
                    </v-card-text>
                  </v-card>

                  <!-- Actions -->
                  <div
                    class="text-center mt-4 mt-sm-6"
                    v-if="authStore.isAuthenticated"
                  >
                    <v-btn
                      variant="outlined"
                      color="white"
                      :to="{ name: 'Admin' }"
                      class="me-3 me-sm-4"
                      size="large"
                    >
                      <v-icon start>mdi-shield-account</v-icon>
                      Admin Panel
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- 历史对话弹窗 -->
    <v-dialog v-model="isOpenFeedback" max-width="600" scrollable>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center pa-4">
          <span class="text-h6">Mailbox</span>
          <v-btn icon @click="isOpenFeedback = false" variant="text">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-3">
          <div
            ref="MailboxContainer"
            style="max-height: 70vh; overflow-y: auto"
          >
            <template v-if="feedbackHistory.length">
              <v-banner
                v-for="item in feedbackHistory"
                :avatar="
                  item.role === 'user' ? 'userAvatar.svg' : 'adminAvatar.svg'
                "
                :text="item.msg"
                :stacked="false"
              >
              </v-banner>
            </template>
            <template v-else>
              <div class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1" class="mb-2"
                  >mdi-inbox</v-icon
                >
                <div class="text-h6 text-grey-darken-1">No feedback</div>
              </div>
            </template>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <SnackBar
      v-model="snackbar.show"
      :snacbarText="snackbar.text"
      :snackbarColorBt="snackbar.color"
    ></SnackBar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject, openBlock, nextTick } from "vue";
import { useRouter } from "vue-router";
import { feedbacksService } from "@/services/feedbacks.service";
import { useAuthStore } from "@/stores/auth";
import SnackBar from "@/components/widgets/snackBar.vue";

const router = useRouter();
const setLoading = inject("setLoading");
const authStore = useAuthStore();

const valid = ref(false);
const loading = ref(false);
const form = ref(null);
const statsSection = ref(null);
// 是否打开回复的历史
const isOpenFeedback = ref(false);
// 定义响应式变量存储userId
const userId = ref("No UserId");
// dom
const MailboxContainer = ref(null);
// 语言
const language = ref("");

onMounted(async () => {
  await init();
  await getFeedbackByName(userId.value);
  fetchStats();
});

function smoothScrollToBottom() {
  console.log("MailboxContainer.height", MailboxContainer.value);
  if (!MailboxContainer.value) return;
  MailboxContainer.value.scrollTo({
    top: MailboxContainer.value.scrollHeight, // 目标位置（底部）
    behavior: "smooth", // 平滑滚动（替代：'auto' 立即滚动）
  });
}

const openMailboxDislog = () => {
  isOpenFeedback.value = true;
  // 等待弹窗渲染完成后再滚动
  nextTick(() => {
    smoothScrollToBottom();
  });
};

// 复用你的原生getQueryParams方法（完全不变，直接用）
const getQueryParams = () => {
  var url = window.location.href;
  var urlObj = new URL(url);
  var searchParams = urlObj.searchParams;
  var queryParams = {};
  searchParams.forEach(function (value, key) {
    queryParams[key] = value;
  });
  return queryParams;
};

const init = async () => {
  // 获取所有URL参数
  const params = getQueryParams();
  // 赋值给userId（模拟你示例中的document.querySelector赋值逻辑）
  if (params.userid) {
    userId.value = params.userid;
  }

  if (params.language) {
    language.value = params.language;
    console.log("language", language.value);
  }
};

const feedback = reactive({
  name: "",
  rating: null,
  message: "",
});

const snackbar = reactive({
  show: false,
  text: "",
  color: "green",
});

const stats = reactive({
  total: 0,
  averageRating: "0",
  positive: 0,
  weekly: 0,
});

const feedbackHistory = ref([]);
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const deleteFeedback = async (id) => {
  // 添加浏览器原生确认弹窗
  const isConfirmed = window.confirm(
    "Are you sure you want to withdraw this feedback? This action cannot be undone."
  );

  // 如果用户取消，则不执行删除操作
  if (!isConfirmed) {
    return;
  }

  try {
    const response = await feedbacksService.deleteFeedback(id);
    console.log("response-delete", response);
    showSnackbar("Your feedback has been withdrawed successfully!", "green");
    await getFeedbackByName(userId.value);
  } catch (error) {
    showSnackbar("Error withdraw feedback", "red");
    console.error("Error withdraw feedback:", error);
  }
};

// Form validation rules
const nameRules = [
  (v) => !!v || "Full name is required",
  (v) => (v && v.length >= 2) || "Name must contain at least 2 characters",
];

const ratingRules = [(v) => !!v || "Rating is required"];

const messageRules = [
  (v) => !!v || "Message is required",
  (v) => (v && v.length >= 10) || "Message must contain at least 10 characters",
  (v) =>
    (v && v.length <= 500) || "Message must contain less than 500 characters",
];

// Rating options
const ratingItems = [
  { title: "1 - Not Satisfied", value: 1 },
  { title: "2 - Less Satisfied", value: 2 },
  { title: "3 - Okay", value: 3 },
  { title: "4 - Satisfied", value: 4 },
  { title: "5 - Very Satisfied", value: 5 },
];

const handleSubmitFeedback = async () => {
  if (!valid.value) return;

  loading.value = true;
  setLoading?.(true);

  try {
    const response = await feedbacksService.submitFeedback({
      name: userId.value,
      message: { role: "user", msg: feedback.message },
    });
    showSnackbar("Your feedback has been submitted successfully!", "green");
    resetForm();
    await fetchStats();
    await getFeedbackByName(userId.value);
  } catch (error) {
    showSnackbar("Error submitting feedback", "red");
    console.error("Error submitting feedback:", error);
  } finally {
    loading.value = false;
    setLoading?.(false);
  }
};

const resetForm = () => {
  feedback.name = "";
  feedback.rating = null;
  feedback.message = "";
  form.value?.resetValidation();
};

const showSnackbar = (text, color) => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

const fetchStats = async () => {
  try {
    const response = await feedbacksService.fetchStats();
    console.log(response);

    Object.assign(stats, response);
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
};

// name即userId.value
const getFeedbackByName = async (name) => {
  try {
    const response = await feedbacksService.fetchFeedbackByName(name);
    feedbackHistory.value = response[0]?.message || [];
    console.log("feedback-name", response);
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
};
</script>

<style scoped>
.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  width: 100%;
}

.v-card {
  backdrop-filter: blur(10px);
}

/* 确保容器占满宽度 */
.w-100 {
  width: 100%;
}

/* 响应式字体大小 */
@media (max-width: 600px) {
  .text-responsive {
    font-size: 0.875rem;
  }
}

/* 移动端优化 */
@media (max-width: 960px) {
  .gradient-bg {
    padding: 0;
  }

  .v-card {
    margin: 0 8px;
  }
}

/* 平板优化 */
@media (min-width: 960px) and (max-width: 1264px) {
  .v-container {
    max-width: 100%;
  }
}
</style>
