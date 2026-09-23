require("dotenv").config();
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  img: String,
  price: Number,
  discount: Number,
  category: String,
  type: String,
  brand: String,
  description: String,
  rating: Number,
  quantity: Number,
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

const products = [
  {
    title: "Hydrating Face Cream",
    slug: "hydrating-face-cream",
    img: "/assets/img/product/product-1.jpg",
    price: 29.99,
    discount: 10,
    category: "skincare",
    type: "beauty",
    brand: "Shofy",
    description: "A lightweight daily moisturizer for soft, hydrated skin.",
    rating: 4.5,
    quantity: 100,
  },
  {
    title: "Velvet Matte Lipstick",
    slug: "velvet-matte-lipstick",
    img: "/assets/img/product/product-2.jpg",
    price: 18.99,
    discount: 0,
    category: "makeup",
    type: "cosmetics",
    brand: "Shofy",
    description: "Long-lasting color with a comfortable matte finish.",
    rating: 4.2,
    quantity: 75,
  },
];

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shofy", {
  serverSelectionTimeoutMS: 5000,
})
  .then(async () => {
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
    await mongoose.disconnect();
  })
  .catch((error) => {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error("Start MongoDB or set MONGODB_URI in backend/.env, then run npm run seed again.");
    process.exit(1);
  });
