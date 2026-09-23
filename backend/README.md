# Local backend

This is the Express and MongoDB API used by the Next.js storefront.

## Setup

1. Install MongoDB locally or create a MongoDB Atlas database.
2. Copy `.env.example` to `.env`.
3. Set `MONGODB_URI` and replace `JWT_SECRET`.
4. Install dependencies:

```bash
npm install
```

5. Seed sample products:

```bash
npm run seed
```

6. Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000`. Set the frontend `NEXT_PUBLIC_API_BASE_URL` to that URL in the root `.env.local` file.

`STRIPE_SECRET_KEY` is optional for COD orders. Card payments return a clear configuration error until a Stripe secret key is supplied.

## Add a product

First log in through `POST /api/user/login` and copy the returned token. Then send:

```http
POST http://localhost:5000/api/product/add
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

```json
{
	"title": "Daily Face Serum",
	"slug": "daily-face-serum",
	"price": 24.99,
	"type": "beauty",
	"category": "skincare",
	"brand": "Shofy",
	"quantity": 50,
	"description": "A lightweight daily serum."
}
```

The frontend can call the same endpoint with `useAddProductMutation` from `src/redux/features/productApi.js`.

## My orders

Get all order details for the authenticated user:

```http
GET http://localhost:5000/api/my-orders
Authorization: Bearer YOUR_TOKEN
```

The response includes `data`, `orders`, and `count`.
