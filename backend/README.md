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
