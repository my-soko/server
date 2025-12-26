import express from 'express';
import cookieParser from "cookie-parser";
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/prisma.js';
import authRoute from "./routes/auth.routes.js"
import productRoute from "./routes/product.routes.js"
import reviewRoutes from "./routes/review.routes.js"
import paymentRoutes from "./routes/payment.routes.js"
import favouriteRoutes from "./routes/favourite.routes.js"
import uploadRouter from "./routes/upload.js"


const app = express();
app.use(cookieParser());
dotenv.config();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,             
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

app.use("/auth", authRoute);
app.use("/api/product", productRoute);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/favourite", favouriteRoutes);
app.use("/api/upload", uploadRouter);

const PORT = process.env.PORT || 5000;

(async () => {
    try {
        await prisma.$connect();
        console.log("✅ Connected to PostgreSQL Database");
    } catch (error) {
        console.error("❌ Database connection error:", error);
    }
})();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

