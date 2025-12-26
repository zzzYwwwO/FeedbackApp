import express from "express";
import path from "path";
import * as url from "url";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import auth from "./src/router/authRoute.js";
import feedback from "./src/router/feedbackRoute.js";
import Users from "./config/models/users.js";
import Feedback from "./config/models/feedback.js";
dotenv.config();

const uri = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === "production";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export default function server() {
  const app = express();

  // הגדרת אדרים מומלצים של אקספרס
  app.use(
    cors({
      origin: "*",
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // 根据环境变量配置静态文件服务
  if (isProduction) {
    // 生产环境：使用打包好的dist文件
    console.log("🚀 Production mode: Serving static files from dist/");
    console.log(`user: http://localhost:${process.env.PORT}/?userId=user_503`);
    console.log(`admin: http://localhost:${process.env.PORT}/admin`);
    app.use(express.static(path.join(__dirname, "dist")));
  } else {
    // 开发环境：使用前端开发服务器（需要npm run dev）
    console.log(
      "🔧 Development mode: Frontend should be running on npm run dev"
    );
    console.log(
      `Frontend dev server: http://localhost:${process.env.PORT_FRONTEND}`
    );
  }

  mongoose
    .connect(uri, {})
    .then(async (results) => {
      try {
        // create demo admin if not exist
        const adminEmail = "admin@example.com";
        const existingAdmin = await Users.findOne({ email: adminEmail });

        if (!existingAdmin) {
          const admin = new Users({
            name: "Admin",
            email: adminEmail,
            password: "Admin1234", // סיסמה עומדת בתנאים (אותיות+מספרים, לפחות 9 תווים)
            role: "admin",
          });

          await admin.save();
          console.log("Default demo admin created:");
          console.log(`   Email: ${adminEmail}`);
          console.log("   Password: Admin1234");
        } else {
          console.log("Demo admin already exists.");
        }

        // Create 12 demo feedbacks if none exist
        const feedbackCount = await Feedback.countDocuments();
        if (feedbackCount === 0) {
          const sampleFeedbacks = [];

          for (let i = 1; i <= 12; i++) {
            sampleFeedbacks.push({
              name: `user ${i}`,
              rating: Math.floor(Math.random() * 5) + 1,
              message: `This is sample feedback number ${i} for demonstration purposes.`,
            });
          }

          await Feedback.insertMany(sampleFeedbacks);
          console.log("12 demo feedbacks inserted");
        } else {
          console.log("Feedbacks already exist.");
        }
      } catch (error) {
        console.error("Failed to create default admin:", error);
      }

      app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
        // console.log(`Frontend: http://localhost:${process.env.PORT_FRONTEND}`);
        // console.log(
        //   `Admin login: http://localhost:${process.env.PORT_FRONTEND}/login`
        // );
        // console.log(
        //   `Admin Panel: http://localhost:${process.env.PORT_FRONTEND}/admin`
        // );
      });
    })
    .catch((error) => {
      console.error("Error connecting to the database:", error);
    });

  app.use("/api/auth", auth);
  app.use("/api/feedback", feedback);

  // 根据环境变量配置路由处理
  if (isProduction) {
    // 生产环境：所有非API路由都返回index.html（SPA路由）
    app.use("/*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  } else {
    // 开发环境：API路由正常处理，其他路由由前端开发服务器处理
    app.use("/*", (req, res) => {
      res.redirect(
        `http://localhost:${process.env.PORT_FRONTEND}${req.originalUrl}`
      );
    });
  }

  // Custom error-handling middleware
  app.use((err, req, res, next) => {
    console.error(err);
    return res
      .status(err.statusCode || 500)
      .json({ error: err.message || "Internal Server Error" });
  });
}
