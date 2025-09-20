const express = require("express");
const User = require("../models/User");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API xác thực người dùng (login, register, logout)
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng ký thành công
 */
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.json({ message: "Đăng ký thành công!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập hệ thống
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
  }

  req.session.userId = user._id;

  // Tạo cookie "auth" để client dễ sử dụng hơn (lưu sessionId)
  res.cookie("auth", req.sessionID, {
    httpOnly: true,
    secure: false, // để true nếu chạy HTTPS
    maxAge: 1000 * 60 * 60, // 1 giờ
  });

  res.json({ message: "Đăng nhập thành công" });
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất tài khoản
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post("/logout", (req, res) => {
  res.clearCookie("auth"); // xóa cookie "auth"
  req.session.destroy(() => {
    res.json({ message: "Đăng xuất thành công" });
  });
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Kiểm tra trạng thái đăng nhập
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đang đăng nhập
 *       401:
 *         description: Chưa đăng nhập
 */
router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }
  res.json({ message: "Đang đăng nhập", userId: req.session.userId });
});

module.exports = router;
