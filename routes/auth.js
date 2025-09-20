const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Đăng ký
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

// Đăng nhập
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
    secure: false,   // để true nếu chạy HTTPS
    maxAge: 1000 * 60 * 60, // 1 giờ
  });

  res.json({ message: "Đăng nhập thành công" });
});

// Đăng xuất
router.post("/logout", (req, res) => {
  res.clearCookie("auth"); // xóa cookie "auth"
  req.session.destroy(() => {
    res.json({ message: "Đăng xuất thành công" });
  });
});

// Check login
router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }
  res.json({ message: "Đang đăng nhập", userId: req.session.userId });
});

module.exports = router;
