require("dotenv").config();

const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const morgan = require("morgan");

const app = express();
const port = Number(process.env.PORT || 5000);
const jwtSecret = process.env.JWT_SECRET || "development-secret-change-me";

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    img: String,
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    category: String,
    type: String,
    brand: String,
    description: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    quantity: { type: Number, default: 0, min: 0 },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: { type: Array, default: [] },
    shipping_info: { type: mongoose.Schema.Types.Mixed, default: {} },
    payment: { type: String, default: "COD" },
    paymentIntent: { type: mongoose.Schema.Types.Mixed },
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "processing", "delivered", "cancelled"], default: "pending" },
  },
  { timestamps: true }
);

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const categorySchema = new mongoose.Schema({ title: { type: String, required: true }, type: String }, { timestamps: true });
const brandSchema = new mongoose.Schema({ title: { type: String, required: true }, logo: String, status: { type: String, default: "active" } }, { timestamps: true });
const couponSchema = new mongoose.Schema({ title: String, code: { type: String, unique: true }, discountPercentage: Number, discountProductType: String, endTime: Date, status: { type: String, default: "active" } }, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);
const Review = mongoose.model("Review", reviewSchema);
const Category = mongoose.model("Category", categorySchema);
const Brand = mongoose.model("Brand", brandSchema);
const Coupon = mongoose.model("Coupon", couponSchema);

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const createToken = (user) => jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: "7d" });
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });

const requireAuth = asyncRoute(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  const payload = jwt.verify(token, jwtSecret);
  req.user = await User.findById(payload.id);
  if (!req.user) return res.status(401).json({ error: "User not found" });
  next();
});

app.get("/api/health", (req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1 }));

app.post("/api/user/signup", asyncRoute(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ error: "Name, email, and a 6-character password are required" });
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: "Email is already registered" });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  res.status(201).json({ message: "Registration successful", data: { user: publicUser(user), token: createToken(user) } });
}));

app.post("/api/user/login", asyncRoute(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || "").toLowerCase() });
  if (!user || !(await bcrypt.compare(req.body.password || "", user.password))) return res.status(401).json({ error: "Invalid email or password" });
  res.json({ data: { user: publicUser(user), token: createToken(user) } });
}));

app.get("/api/user/me", requireAuth, asyncRoute(async (req, res) => res.json(publicUser(req.user))));
app.put("/api/user/update-user/:id", requireAuth, asyncRoute(async (req, res) => {
  if (String(req.user._id) !== req.params.id && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const user = await User.findByIdAndUpdate(req.params.id, { name: req.body.name, email: req.body.email }, { new: true, runValidators: true });
  res.json({ data: { user: publicUser(user), token: createToken(user) } });
}));

app.get("/api/product/all", asyncRoute(async (req, res) => res.json({ data: await Product.find().sort({ createdAt: -1 }) })));
app.get("/api/product/offer", asyncRoute(async (req, res) => res.json({ data: await Product.find({ discount: { $gt: 0 }, ...(req.query.type ? { type: req.query.type } : {}) }) })));
app.get("/api/product/popular/:type", asyncRoute(async (req, res) => res.json({ data: await Product.find({ type: req.params.type }).sort({ rating: -1 }).limit(12) })));
app.get("/api/product/top-rated", asyncRoute(async (req, res) => res.json({ data: await Product.find().sort({ rating: -1 }).limit(12) })));
app.get("/api/product/single-product/:id", asyncRoute(async (req, res) => res.json({ data: await Product.findById(req.params.id).populate("reviews") })));
app.get("/api/product/related-product/:id", asyncRoute(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ data: await Product.find({ category: product.category, _id: { $ne: product._id } }).limit(4) });
}));
app.get("/api/product/:type", asyncRoute(async (req, res) => {
  const filter = { type: req.params.type };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.new === "true") filter.createdAt = { $exists: true };
  if (req.query.featured === "true") filter.featured = true;
  const sort = req.query.new === "true" ? { createdAt: -1 } : req.query.topSellers === "true" ? { sales: -1 } : { createdAt: -1 };
  const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 100);
  res.json({ data: await Product.find(filter).sort(sort).limit(limit) });
}));

app.post("/api/review/add", requireAuth, asyncRoute(async (req, res) => {
  const review = await Review.create({ ...req.body, userId: req.user._id, name: req.user.name });
  await Product.findByIdAndUpdate(req.body.productId, { $push: { reviews: review._id } });
  res.status(201).json({ data: review, message: "Review added" });
}));

app.post("/api/category/add", requireAuth, asyncRoute(async (req, res) => res.status(201).json({ data: await Category.create(req.body) })));
app.get("/api/category/show", asyncRoute(async (req, res) => res.json({ data: await Category.find() })));
app.get("/api/category/show/:type", asyncRoute(async (req, res) => res.json({ data: await Category.find({ type: req.params.type }) })));
app.get("/api/brand/active", asyncRoute(async (req, res) => res.json({ data: await Brand.find({ status: "active" }) })));
app.get("/api/coupon", asyncRoute(async (req, res) => res.json({ data: await Coupon.find({ status: "active", $or: [{ endTime: null }, { endTime: { $gt: new Date() } }] }) })));

app.post("/api/order/saveOrder", requireAuth, asyncRoute(async (req, res) => {
  const body = req.body || {};
  const order = await Order.create({ ...body, user: req.user._id, totalAmount: body.totalAmount || body.amount || 0 });
  res.status(201).json({ data: { order }, order, message: "Order saved" });
}));
app.get("/api/user-order", requireAuth, asyncRoute(async (req, res) => res.json({ data: await Order.find({ user: req.user._id }).sort({ createdAt: -1 }) })));
app.get("/api/user-order/:id", requireAuth, asyncRoute(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ data: order });
}));

app.post("/api/order/create-payment-intent", requireAuth, asyncRoute(async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: "Stripe is not configured" });
  const Stripe = require("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const intent = await stripe.paymentIntents.create({ amount: Math.round(Number(req.body.amount) * 100), currency: req.body.currency || "usd" });
  res.json({ clientSecret: intent.client_secret });
}));

app.use((error, req, res, next) => {
  console.error(error);
  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return res.status(401).json({ error: "Invalid or expired token" });
  if (error.code === 11000) return res.status(409).json({ error: "A record with that value already exists" });
  res.status(500).json({ error: "Internal server error" });
});

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shofy")
  .then(() => app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`)))
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
