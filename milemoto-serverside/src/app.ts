import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { api } from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";
import { env } from "./config/env.js";
import { authLimiter, loginLimiter } from "./middleware/rateLimit.js";

export const app = express();
const allowed = new Set(env.CORS_ORIGINS.split(",").map((s) => s.trim()));

app.set("trust proxy", env.TRUST_PROXY); // see env.ts change below

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowed.has(origin)) return cb(null, true);
      return cb(new Error("CORS blocked"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use('/api/auth', authLimiter);
app.use('/api/uploads', loginLimiter);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));

app.get("/", (_req, res) =>
  res.json({ name: "MileMoto API", version: "0.1.0" })
);
app.use("/api", api);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, 
  contentSecurityPolicy: false, 
}));

app.use(notFound);
app.use(errorHandler);
