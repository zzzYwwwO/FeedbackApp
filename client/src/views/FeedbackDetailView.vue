<template>
  <v-container class="py-6">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <div class="d-flex align-center mb-6">
          <v-btn icon variant="text" @click="$router.go(-1)" class="me-2">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h1 class="text-h4 font-weight-bold">反馈详情</h1>
        </div>

        <!-- Loading -->
        <v-card v-if="loading" class="text-center pa-8">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
          <div class="mt-4">正在加载反馈详情...</div>
        </v-card>

        <!-- Error -->
        <v-card
          v-else-if="error"
          class="text-center pa-8"
          color="error-lighten-5"
        >
          <v-icon size="64" color="error">mdi-alert-circle</v-icon>
          <div class="text-h6 mt-4">{{ error }}</div>
          <v-btn
            color="primary"
            class="mt-4"
            @click="$router.push({ name: 'Admin' })"
          >
            返回反馈列表
          </v-btn>
        </v-card>

        <!-- Feedback Details -->
        <v-card v-else-if="feedback" class="elevation-4">
          <v-card-title class="pa-6 bg-primary text-white">
            <div class="d-flex justify-space-between align-center w-100">
              <div class="d-flex align-center">
                <v-avatar color="white" class="me-3">
                  <v-icon color="primary">mdi-account</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5">{{ feedback.name }}</div>
                  <div class="text-caption">
                    {{ formatDate(feedback.createdAt) }}
                  </div>
                </div>
              </div>
              <div>
                <v-chip v-if="feedback.isReply" color="green" variant="flat">
                  已回复
                </v-chip>
                <v-chip v-if="!feedback.isReply" color="red" variant="flat">
                  未回复
                </v-chip>
                <v-chip
                  :color="getRatingColor(feedback.rating)"
                  variant="flat"
                  size="large"
                  class="text-white"
                  style="margin-left: 1vw"
                >
                  <v-icon start>mdi-star</v-icon>
                  {{ feedback.rating }} - {{ getRatingText(feedback.rating) }}
                </v-chip>
              </div>
            </div>
          </v-card-title>

          <!-- Content -->
          <v-card-text class="pa-6">
            <div class="mb-6">
              <div class="d-flex justify-space-between">
                <h3 class="text-h6 mb-3">反馈内容：</h3>
                <v-btn color="error" variant="outlined" @click="deleteFeedback">
                  <v-icon start>mdi-delete</v-icon>
                  删除反馈
                </v-btn>
              </div>

              <div class="text-body-1 pa-4 bg-grey-lighten-4 rounded">
                {{ feedback.message }}
              </div>
            </div>

            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-4">
                  <div class="text-subtitle-2 text-grey-darken-1 mb-1">
                    创建日期
                  </div>
                  <div class="text-body-1">
                    {{ formatFullDate(feedback.createdAt) }}
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-4">
                  <div class="text-subtitle-2 text-grey-darken-1 mb-1">
                    反馈ID
                  </div>
                  <div class="text-body-1 font-mono">{{ feedback._id }}</div>
                </v-card>
              </v-col>
            </v-row>

            <!-- Rating -->
            <v-card variant="outlined" class="mt-4 pa-4">
              <div style="display: flex; justify-content: space-between">
                <h4 class="text-h6 mb-3">回复</h4>
                <v-btn @click="replyToUser(feedback._id)">
                  {{ feedback.isReply ? "更新" : "提交" }}
                  <template #append>
                    <img src="/send.svg" alt="" />
                  </template>
                </v-btn>
              </div>

              <div class="d-flex align-center mb-2">
                <v-textarea
                  v-model="reply"
                  :rules="messageRules"
                  row-height="15"
                  rows="3"
                ></v-textarea>
              </div>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          您确定要删除 {{ feedback?.name }} 的反馈吗？此操作无法撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="confirmDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SnackBar
      v-model="snackbar.show"
      :snacbarText="snackbar.text"
      :snackbarColorBt="snackbar.color"
    ></SnackBar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { feedbacksService } from "@/services/feedbacks.service";
import SnackBar from "@/components/widgets/snackBar.vue";

const props = defineProps({
  id: String,
});

const snackbar = reactive({
  show: false,
  text: "",
  color: "green",
});

const showSnackbar = (text, color) => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

const feedback = ref(null);
const loading = ref(true);
const error = ref(null);
const deleteDialog = ref(false);
const reply = ref("");

const route = useRoute();
const router = useRouter();

const replyToUser = async (id) => {
  try {
    console.log("回复", reply);
    const response = await feedbacksService.replyFeedback(id, reply.value);
    console.log("reply-response", response);
    showSnackbar("回复成功！", "green");
    fetchFeedback();
  } catch (err) {
    error.value = "回复反馈时出错";
    showSnackbar("回复失败！", "red");
    console.error("Error reply feedback:", err);
  }
};

const fetchFeedback = async () => {
  try {
    const feedbackId = props.id || route.params.id;
    const response = await feedbacksService.fetchFeedback(feedbackId);
    if (response) {
      feedback.value = response;
      console.log("回显", feedback.value);
      // 如果有反馈，尝试查找是否有回复，如果有就回显
      if (feedback.value.isReply) {
        reply.value = feedback.value.reply;
      }
    } else {
      error.value = "反馈未找到";
    }
  } catch (err) {
    error.value = "加载反馈时出错";
    console.error("Error fetching feedback:", err);
  } finally {
    loading.value = false;
  }
};

const getRatingColor = (rating) => {
  if (rating >= 4) return "green";
  if (rating >= 3) return "amber";
  return "red";
};

const messageRules = [
  (v) => !!v || "Message is required",
  (v) => (v && v.length >= 5) || "Message must contain at least 5 characters",
  (v) =>
    (v && v.length <= 500) || "Message must contain less than 500 characters",
];

const getRatingText = (rating) => {
  const texts = {
    1: "不满意",
    2: "不太满意",
    3: "一般",
    4: "满意",
    5: "非常满意",
  };
  return texts[rating] || "未知";
};

const getRatingDescription = (rating) => {
  const descriptions = {
    1: "客户体验不佳，需要重大改进",
    2: "服务或产品有改进空间",
    3: "体验一般，可以改进",
    4: "客户对服务或产品满意",
    5: "体验极佳！客户非常满意",
  };
  return descriptions[rating] || "";
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatFullDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("zh-CN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const deleteFeedback = () => {
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  try {
    const feedbackId = props.id || route.params.id;
    await feedbacksService.deleteFeedback(feedbackId);
    router.replace({ name: "Admin" });
  } catch (error) {
    error.value = "删除反馈时出错";
    console.error("Error deleting feedback:", error);
  }
  deleteDialog.value = false;
};

onMounted(() => {
  fetchFeedback();
});
</script>

<style scoped>
.font-mono {
  font-family: "Courier New", monospace;
  font-size: 0.875rem;
}
</style>
