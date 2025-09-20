const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// Import routes
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/session_auth")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Session config
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecretkey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/session_auth",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
      secure: false,
    },
  })
);

// Middleware để biến `user` luôn có sẵn trong view
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Swagger cấu hình
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Session Auth API",
      version: "1.0.0",
      description: "API login/logout với session & cookie",
    },
    servers: [{ url: "http://localhost:3000" }],
  },
  apis: ["./routes/*.js"], // lấy docs từ comment trong routes
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes API
app.use("/auth", authRoutes);

// Routes View
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // TODO: gọi API login -> nếu thành công thì lưu session
  req.session.user = { username }; // demo
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  // TODO: gọi API register
  res.redirect("/login");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
}
);
