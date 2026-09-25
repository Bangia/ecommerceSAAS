require("dotenv").config();

const bcrypt = require("bcryptjs");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
const express = require("express");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const morgan = require("morgan");
const PaytmChecksum = require("paytmchecksum");

const app = express();
const port = Number(process.env.PORT || 5000);
const jwtSecret = process.env.JWT_SECRET || "development-secret-change-me";
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "Dipl0mat@qa";
const adminEmail = process.env.ADMIN_EMAIL || "admin@shofy.local";

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
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

const categorySchema = new mongoose.Schema({ title: { type: String, required: true, unique: true }, type: String }, { timestamps: true });
const brandSchema = new mongoose.Schema({ title: { type: String, required: true }, logo: String, status: { type: String, default: "active" } }, { timestamps: true });
const couponSchema = new mongoose.Schema({ title: String, code: { type: String, unique: true }, discountPercentage: Number, discountProductType: String, endTime: Date, status: { type: String, default: "active" } }, { timestamps: true });
const productTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  value: { type: String, required: true, unique: true, trim: true, lowercase: true },
}, { timestamps: true });
const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  designation: { type: String, default: "Customer", trim: true },
  review: { type: Number, default: 5, min: 0, max: 5 },
  desc: { type: String, required: true, trim: true },
  type: { type: String, default: "beauty", trim: true },
  image: String,
  status: { type: String, default: "active", enum: ["active", "inactive"] },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);
const Review = mongoose.model("Review", reviewSchema);
const Category = mongoose.model("Category", categorySchema);
const Brand = mongoose.model("Brand", brandSchema);
const Coupon = mongoose.model("Coupon", couponSchema);
const ProductType = mongoose.model("ProductType", productTypeSchema);
const Testimonial = mongoose.model("Testimonial", testimonialSchema);
const defaultProductTypes = [
  { name: "Beauty", value: "beauty" },
  { name: "Cosmetics", value: "cosmetics" },
  { name: "Fashion", value: "fashion" },
  { name: "Electronics", value: "electronics" },
];
const defaultCategories = [
  { title: "skincare", type: "beauty" },
  { title: "makeup", type: "cosmetics" },
  { title: "mens-fashion", type: "fashion" },
  { title: "accessories", type: "fashion" },
  { title: "womens-fashion", type: "fashion" },
  { title: "footwear", type: "fashion" },
  { title: "audio", type: "electronics" },
  { title: "wearables", type: "electronics" },
  { title: "mobile-accessories", type: "electronics" },
  { title: "mens-jeans", type: "fashion" },
  { title: "mens-trouser", type: "fashion" },
  { title: "mens-pants", type: "fashion" },
  { title: "mens-joggers", type: "fashion" },
  { title: "mens-shirt", type: "fashion" },
  { title: "mens-tshirts", type: "fashion" },
  { title: "mens-undergarments", type: "fashion" },
  { title: "womens-jeans", type: "fashion" },
  { title: "womens-trouser", type: "fashion" },
  { title: "womens-pants", type: "fashion" },
  { title: "womens-joggers", type: "fashion" },
  { title: "womens-shirt", type: "fashion" },
  { title: "womens-tshirts", type: "fashion" },
  { title: "womens-undergarments", type: "fashion" },
  { title: "kids-jeans", type: "fashion" },
  { title: "kids-trouser", type: "fashion" },
  { title: "kids-pants", type: "fashion" },
  { title: "kids-joggers", type: "fashion" },
  { title: "kids-shirt", type: "fashion" },
  { title: "kids-tshirts", type: "fashion" },
  { title: "kids-undergarments", type: "fashion" },
  { title: "mobile", type: "electronics" },
  { title: "tv", type: "electronics" },
  { title: "laptops", type: "electronics" },
  { title: "tablets", type: "electronics" },
  { title: "cameras", type: "electronics" },
];
const defaultTestimonials = [
  { name: "Jake Weary", designation: "CO Founder", review: 4, type: "beauty", desc: "A beautiful shopping experience from start to finish. The products arrived quickly and felt thoughtfully chosen." },
  { name: "Salim Rana", designation: "Web Developer", review: 5, type: "beauty", desc: "The quality was excellent and the support team made everything easy. I will definitely shop here again." },
  { name: "Selina Gomz", designation: "CO Founder", review: 5, type: "fashion", desc: "The collection feels fresh, well made, and easy to style. My order looked exactly like the product photos." },
  { name: "Theodore Handle", designation: "CO Founder", review: 4, type: "fashion", desc: "Great products, a smooth checkout, and fast delivery. This is now one of my favorite stores." },
];

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

const requireAdmin = (req, res, next) => requireAuth(req, res, () => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
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

app.post("/api/admin/login", asyncRoute(async (req, res) => {
  if (String(req.body.username || "") !== adminUsername || String(req.body.password || "") !== adminPassword) {
    return res.status(401).json({ error: "Invalid admin username or password" });
  }
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({ name: "Administrator", email: adminEmail, password: await bcrypt.hash(adminPassword, 12), role: "admin" });
  } else if (admin.role !== "admin") {
    admin.role = "admin";
    await admin.save();
  }
  res.json({ data: { user: publicUser(admin), token: createToken(admin) } });
}));

app.get("/api/user/me", requireAuth, asyncRoute(async (req, res) => res.json(publicUser(req.user))));
app.put("/api/user/update-user/:id", requireAuth, asyncRoute(async (req, res) => {
  if (String(req.user._id) !== req.params.id && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const user = await User.findByIdAndUpdate(req.params.id, { name: req.body.name, email: req.body.email }, { new: true, runValidators: true });
  res.json({ data: { user: publicUser(user), token: createToken(user) } });
}));

app.post("/api/product/add", requireAdmin, asyncRoute(async (req, res) => {
  const { title, slug, price, type } = req.body;
  if (!title || !slug || price === undefined || !type) {
    return res.status(400).json({ error: "title, slug, price, and type are required" });
  }

  const product = await Product.create({
    ...req.body,
    price: Number(price),
  });

  res.status(202).json({
    message: `${product.title} added successfully`,
    productName: product.title,
    data: product,
  });
}));

app.put("/api/product/:id", requireAdmin, asyncRoute(async (req, res) => {
  const allowedFields = ["title", "slug", "img", "price", "discount", "category", "type", "brand", "description", "rating", "quantity"];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
  if (updates.price !== undefined) updates.price = Number(updates.price);
  if (updates.discount !== undefined) updates.discount = Number(updates.discount);
  if (updates.rating !== undefined) updates.rating = Number(updates.rating);
  if (updates.quantity !== undefined) updates.quantity = Number(updates.quantity);
  const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ data: product, message: "Product updated" });
}));

app.delete("/api/product/:id", requireAdmin, asyncRoute(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  await Review.deleteMany({ productId: product._id });
  res.json({ message: "Product deleted", id: product._id });
}));

app.get("/api/type/all", asyncRoute(async (req, res) => {
  const types = await ProductType.find().sort({ name: 1 });
  res.json({ data: types });
}));
app.post("/api/type/add", requireAdmin, asyncRoute(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const value = String(req.body.value || name).trim().toLowerCase().replace(/\s+/g, "-");
  if (!name || !value) return res.status(400).json({ error: "Type name is required" });
  res.status(201).json({ data: await ProductType.create({ name, value }), message: "Type added" });
}));
app.put("/api/type/:id", requireAdmin, asyncRoute(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
  if (req.body.value !== undefined) updates.value = String(req.body.value).trim().toLowerCase().replace(/\s+/g, "-");
  const type = await ProductType.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!type) return res.status(404).json({ error: "Type not found" });
  res.json({ data: type, message: "Type updated" });
}));
app.delete("/api/type/:id", requireAdmin, asyncRoute(async (req, res) => {
  const type = await ProductType.findById(req.params.id);
  if (!type) return res.status(404).json({ error: "Type not found" });
  if (await Product.exists({ type: type.value })) return res.status(409).json({ error: "Type is used by a product and cannot be deleted" });
  await type.deleteOne();
  res.json({ message: "Type deleted", id: type._id });
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

app.get("/api/review/all", requireAdmin, asyncRoute(async (req, res) => {
  const reviews = await Review.find().populate("productId", "title").populate("userId", "name email").sort({ createdAt: -1 });
  res.json({ data: reviews });
}));

app.put("/api/review/:id", requireAdmin, asyncRoute(async (req, res) => {
  const updates = {};
  if (req.body.rating !== undefined) updates.rating = Number(req.body.rating);
  if (req.body.comment !== undefined) updates.comment = req.body.comment;
  const review = await Review.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .populate("productId", "title")
    .populate("userId", "name email");
  if (!review) return res.status(404).json({ error: "Review not found" });
  res.json({ data: review, message: "Review updated" });
}));

app.delete("/api/review/:id", requireAdmin, asyncRoute(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ error: "Review not found" });
  await Product.findByIdAndUpdate(review.productId, { $pull: { reviews: review._id } });
  res.json({ message: "Review deleted", id: review._id });
}));

app.get("/api/testimonial/all", asyncRoute(async (req, res) => {
  const filter = req.query.type ? { type: req.query.type } : {};
  res.json({ data: await Testimonial.find(filter).sort({ createdAt: -1 }) });
}));
app.post("/api/testimonial/add", requireAdmin, asyncRoute(async (req, res) => {
  const testimonial = await Testimonial.create({ ...req.body, review: Number(req.body.review || 5) });
  res.status(201).json({ data: testimonial, message: "Testimonial added" });
}));
app.put("/api/testimonial/:id", requireAdmin, asyncRoute(async (req, res) => {
  const updates = { ...req.body };
  if (updates.review !== undefined) updates.review = Number(updates.review);
  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!testimonial) return res.status(404).json({ error: "Testimonial not found" });
  res.json({ data: testimonial, message: "Testimonial updated" });
}));
app.delete("/api/testimonial/:id", requireAdmin, asyncRoute(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) return res.status(404).json({ error: "Testimonial not found" });
  res.json({ message: "Testimonial deleted", id: testimonial._id });
}));

const getCategoryPayload = async (filter = {}) => {
  const categories = await Category.find(filter).sort({ title: 1 });
  return Promise.all(categories.map(async (category) => {
    const item = category.toObject();
    const products = await Product.find({ category: item.title }).select("_id");
    return { ...item, parent: item.title, products };
  }));
};
app.post("/api/category/add", requireAdmin, asyncRoute(async (req, res) => res.status(201).json({ data: await Category.create({ title: String(req.body.title || "").trim().toLowerCase(), type: req.body.type }) })));
app.get("/api/category/show", asyncRoute(async (req, res) => {
  const data = await getCategoryPayload();
  res.json({ data, result: data });
}));
app.get("/api/category/show/:type", asyncRoute(async (req, res) => {
  const data = await getCategoryPayload({ type: req.params.type });
  res.json({ data, result: data });
}));
app.put("/api/category/:id", requireAdmin, asyncRoute(async (req, res) => {
  const updates = {};
  if (req.body.title !== undefined) updates.title = String(req.body.title).trim().toLowerCase();
  if (req.body.type !== undefined) updates.type = req.body.type;
  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ error: "Category not found" });
  res.json({ data: category, message: "Category updated" });
}));
app.delete("/api/category/:id", requireAdmin, asyncRoute(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ error: "Category not found" });
  if (await Product.exists({ category: category.title })) return res.status(409).json({ error: "Category is used by a product and cannot be deleted" });
  await category.deleteOne();
  res.json({ message: "Category deleted", id: category._id });
}));
app.get("/api/brand/active", asyncRoute(async (req, res) => res.json({ data: await Brand.find({ status: "active" }) })));
app.get("/api/coupon", asyncRoute(async (req, res) => res.json({ data: await Coupon.find({ status: "active", $or: [{ endTime: null }, { endTime: { $gt: new Date() } }] }) })));

app.post("/api/order/saveOrder", requireAuth, asyncRoute(async (req, res) => {
  const body = req.body || {};
  const status = String(body.status || "pending").toLowerCase();
  const allowedStatuses = ["pending", "processing", "delivered", "cancelled"];
  const order = await Order.create({
    user: req.user._id,
    products: body.products || body.cart || [],
    shipping_info: body.shipping_info || {
      name: body.name,
      address: body.address,
      contact: body.contact,
      email: body.email,
      city: body.city,
      country: body.country,
      zipCode: body.zipCode,
      shippingOption: body.shippingOption,
      orderNote: body.orderNote,
    },
    payment: body.payment || body.paymentMethod || "COD",
    paymentIntent: body.paymentIntent,
    totalAmount: Number(body.totalAmount || body.amount || 0),
    status: allowedStatuses.includes(status) ? status : "pending",
  });
  res.status(201).json({ data: { order }, order, message: "Order saved" });
}));
app.get("/api/user-order", requireAuth, asyncRoute(async (req, res) => res.json({ data: await Order.find({ user: req.user._id }).sort({ createdAt: -1 }) })));
app.get("/api/my-orders", requireAuth, asyncRoute(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ data: orders, orders, count: orders.length });
}));
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

app.post("/api/order/paytm/initiate", requireAuth, asyncRoute(async (req, res) => {
  const requiredConfig = ["PAYTM_MID", "PAYTM_MERCHANT_KEY", "PAYTM_WEBSITE"];
  if (requiredConfig.some((key) => !process.env[key])) {
    return res.status(503).json({ error: "Paytm sandbox is not configured" });
  }

  const amount = Number(req.body.totalAmount || req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "A valid payment amount is required" });
  }

  const order = await Order.create({
    user: req.user._id,
    products: req.body.products || req.body.cart || [],
    shipping_info: req.body.shipping_info || {},
    payment: "Paytm",
    totalAmount: amount,
    status: "pending",
  });
  const orderId = String(order._id);
  const requestBody = {
    requestType: "Payment",
    mid: process.env.PAYTM_MID,
    websiteName: process.env.PAYTM_WEBSITE,
    orderId,
    callbackUrl: process.env.PAYTM_CALLBACK_URL || `http://localhost:${port}/api/paytm/callback`,
    txnAmount: { value: amount.toFixed(2), currency: process.env.PAYTM_CURRENCY || "INR" },
    userInfo: { custId: String(req.user._id) },
  };
  const signature = await PaytmChecksum.generateSignature(JSON.stringify(requestBody), process.env.PAYTM_MERCHANT_KEY);
  const host = process.env.PAYTM_ENV === "production" ? "https://securegw.paytm.in" : "https://securegw-stage.paytm.in";
  let response;
  try {
    response = await axios.post(`${host}/theia/api/v1/initiateTransaction?mid=${encodeURIComponent(process.env.PAYTM_MID)}&orderId=${encodeURIComponent(orderId)}`, {
      body: requestBody,
      head: { signature },
    });
  } catch (error) {
    await Order.findByIdAndDelete(order._id);
    const resultInfo = error.response?.data?.body?.resultInfo;
    console.error("Paytm initiation failed:", resultInfo || error.message);
    return res.status(502).json({
      error: `Paytm rejected the request${resultInfo?.resultCode ? ` (${resultInfo.resultCode})` : ""}. Verify that PAYTM_MID and PAYTM_MERCHANT_KEY are a matching staging test pair.`,
    });
  }

  if (!response.data?.body?.txnToken) {
    await Order.findByIdAndDelete(order._id);
    const resultInfo = response.data?.body?.resultInfo;
    console.error("Paytm initiation rejected:", resultInfo || response.data);
    return res.status(502).json({
      error: `Paytm rejected the request${resultInfo?.resultCode ? ` (${resultInfo.resultCode})` : ""}. Verify that PAYTM_MID and PAYTM_MERCHANT_KEY are a matching staging test pair.`,
    });
  }

  res.json({
    orderId,
    txnToken: response.data.body.txnToken,
    mid: process.env.PAYTM_MID,
    host,
  });
}));

app.post("/api/paytm/callback", asyncRoute(async (req, res) => {
  if (!process.env.PAYTM_MERCHANT_KEY) return res.status(503).send("Paytm is not configured");
  const callbackData = { ...req.body };
  const checksum = callbackData.CHECKSUMHASH;
  delete callbackData.CHECKSUMHASH;
  const valid = checksum && await PaytmChecksum.verifySignature(callbackData, process.env.PAYTM_MERCHANT_KEY, checksum);
  if (!valid) return res.status(400).send("Invalid Paytm checksum");

  const order = await Order.findById(callbackData.ORDERID);
  if (!order) return res.status(404).send("Order not found");
  const success = callbackData.STATUS === "TXN_SUCCESS";
  order.status = success ? "processing" : "cancelled";
  order.paymentIntent = callbackData;
  await order.save();
  const target = `${process.env.CLIENT_URL || "http://localhost:3000"}/order/${order._id}?payment=${success ? "success" : "failed"}`;
  res.redirect(target);
}));

app.post("/api/order/phonepe/initiate", requireAuth, asyncRoute(async (req, res) => {
  const requiredConfig = ["PHONEPE_MERCHANT_ID", "PHONEPE_SALT_KEY", "PHONEPE_SALT_INDEX"];
  if (requiredConfig.some((key) => !process.env[key])) {
    return res.status(503).json({ error: "PhonePe sandbox is not configured" });
  }
  if (process.env.PHONEPE_MERCHANT_ID.startsWith("DUMMY_") || process.env.PHONEPE_SALT_KEY.startsWith("DUMMY_")) {
    return res.status(503).json({ error: "PhonePe sandbox credentials are placeholders. Add real test credentials." });
  }

  const amount = Number(req.body.totalAmount || req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "A valid payment amount is required" });
  }

  const order = await Order.create({
    user: req.user._id,
    products: req.body.products || req.body.cart || [],
    shipping_info: req.body.shipping_info || {},
    payment: "PhonePe",
    totalAmount: amount,
    status: "pending",
  });
  const merchantTransactionId = String(order._id);
  const callbackUrl = process.env.PHONEPE_CALLBACK_URL || `http://localhost:${port}/api/phonepe/callback`;
  const redirectBase = process.env.PHONEPE_REDIRECT_URL || `${process.env.CLIENT_URL || "http://localhost:3000"}/order`;
  const redirectUrl = `${redirectBase.replace(/\/$/, "")}/${order._id}?payment=phonepe`;
  const requestPayload = {
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    merchantTransactionId,
    merchantUserId: String(req.user._id),
    amount: Math.round(amount * 100),
    redirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl,
    paymentInstrument: { type: "PAY_PAGE" },
  };
  const encodedRequest = Buffer.from(JSON.stringify(requestPayload)).toString("base64");
  const apiPath = "/pg/v1/pay";
  const checksum = `${crypto.createHash("sha256").update(encodedRequest + apiPath + process.env.PHONEPE_SALT_KEY).digest("hex")}###${process.env.PHONEPE_SALT_INDEX}`;
  const host = process.env.PHONEPE_ENV === "production" ? "https://api.phonepe.com/apis/hermes" : "https://api-preprod.phonepe.com/apis/pg-sandbox";
  const response = await axios.post(`${host}${apiPath}`, { request: encodedRequest }, {
    headers: { "Content-Type": "application/json", accept: "application/json", "X-VERIFY": checksum },
  });
  const redirectInfo = response.data?.data?.instrumentResponse?.redirectInfo;
  if (!response.data?.success || !redirectInfo?.url) {
    await Order.findByIdAndDelete(order._id);
    return res.status(502).json({ error: response.data?.message || "PhonePe transaction could not be initialized" });
  }
  res.json({ orderId: merchantTransactionId, redirectUrl: redirectInfo.url });
}));

app.post("/api/phonepe/callback", asyncRoute(async (req, res) => {
  if (!process.env.PHONEPE_SALT_KEY || !process.env.PHONEPE_SALT_INDEX) return res.status(503).send("PhonePe is not configured");
  const encodedResponse = req.body?.response;
  const receivedChecksum = req.headers["x-verify"] || req.body?.checksum;
  const expectedChecksum = encodedResponse && `${crypto.createHash("sha256").update(encodedResponse + process.env.PHONEPE_SALT_KEY).digest("hex")}###${process.env.PHONEPE_SALT_INDEX}`;
  if (!encodedResponse || !receivedChecksum || receivedChecksum !== expectedChecksum) return res.status(400).send("Invalid PhonePe checksum");

  const callbackData = JSON.parse(Buffer.from(encodedResponse, "base64").toString("utf8"));
  const order = await Order.findById(callbackData.data?.merchantTransactionId || callbackData.data?.merchantOrderId);
  if (!order) return res.status(404).send("Order not found");
  const success = callbackData.code === "PAYMENT_SUCCESS" || callbackData.data?.responseCode === "SUCCESS";
  order.status = success ? "processing" : "cancelled";
  order.paymentIntent = callbackData;
  await order.save();
  res.status(200).send("OK");
}));

app.post("/api/order/payu/initiate", requireAuth, asyncRoute(async (req, res) => {
  const requiredConfig = ["PAYU_MERCHANT_KEY", "PAYU_SALT"];
  if (requiredConfig.some((key) => !process.env[key])) {
    return res.status(503).json({ error: "PayU test gateway is not configured" });
  }
  if (process.env.PAYU_MERCHANT_KEY.startsWith("DUMMY_") || process.env.PAYU_SALT.startsWith("DUMMY_")) {
    return res.status(503).json({ error: "PayU test credentials are placeholders. Add real test credentials." });
  }

  const amount = Number(req.body.totalAmount || req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "A valid payment amount is required" });
  }

  const order = await Order.create({
    user: req.user._id,
    products: req.body.products || req.body.cart || [],
    shipping_info: req.body.shipping_info || {},
    payment: "PayU",
    totalAmount: amount,
    status: "pending",
  });
  const txnid = String(order._id);
  const fields = {
    key: process.env.PAYU_MERCHANT_KEY,
    txnid,
    amount: amount.toFixed(2),
    productinfo: "Shofy ecommerce order",
    firstname: String(req.body.shipping_info?.name || req.user.name || "Customer").slice(0, 60),
    email: String(req.body.shipping_info?.email || req.user.email),
    phone: String(req.body.shipping_info?.contact || "9999999999"),
    surl: process.env.PAYU_SUCCESS_URL || `http://localhost:${port}/api/payu/callback`,
    furl: process.env.PAYU_FAILURE_URL || `http://localhost:${port}/api/payu/callback`,
    service_provider: "payu_paisa",
  };
  const hashInput = [fields.key, fields.txnid, fields.amount, fields.productinfo, fields.firstname, fields.email, "", "", "", "", "", "", "", "", "", process.env.PAYU_SALT].join("|");
  fields.hash = crypto.createHash("sha512").update(hashInput).digest("hex");
  res.json({
    orderId: txnid,
    action: process.env.PAYU_ENV === "production" ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment",
    fields,
  });
}));

app.post("/api/payu/callback", asyncRoute(async (req, res) => {
  if (!process.env.PAYU_SALT) return res.status(503).send("PayU is not configured");
  const callback = req.body || {};
  const reverseHashInput = [process.env.PAYU_SALT, callback.status || "", "", "", "", "", "", "", "", "", "", "", callback.email || "", callback.firstname || "", callback.productinfo || "", callback.amount || "", callback.txnid || "", callback.key || ""].join("|");
  const expectedHash = crypto.createHash("sha512").update(reverseHashInput).digest("hex");
  if (!callback.hash || callback.hash !== expectedHash) return res.status(400).send("Invalid PayU hash");

  const order = await Order.findById(callback.txnid);
  if (!order) return res.status(404).send("Order not found");
  const success = callback.status === "success";
  order.status = success ? "processing" : "cancelled";
  order.paymentIntent = callback;
  await order.save();
  res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/order/${order._id}?payment=${success ? "success" : "failed"}`);
}));

app.use((error, req, res, next) => {
  console.error(error);
  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return res.status(401).json({ error: "Invalid or expired token" });
  if (error.code === 11000) return res.status(409).json({ error: "A record with that value already exists" });
  if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ error: error.message });
  res.status(500).json({ error: "Internal server error" });
});

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shofy")
  .then(async () => {
    await Promise.all(defaultProductTypes.map((type) => ProductType.updateOne({ value: type.value }, { $setOnInsert: type }, { upsert: true })));
    await Promise.all(defaultCategories.map((category) => Category.updateOne({ title: category.title }, { $setOnInsert: category }, { upsert: true })));
    await Promise.all(defaultTestimonials.map((testimonial) => Testimonial.updateOne({ name: testimonial.name, type: testimonial.type }, { $setOnInsert: testimonial }, { upsert: true })));
    app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
