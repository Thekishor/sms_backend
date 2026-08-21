import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.handler.js";
import superadminRoutes from "./routes/super-admin.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { globalRateLimiter } from "./config/rate-limiter.js";
import cors from "cors";
import logger from "./config/logger.js";
import { openApiDocument } from "./docs/openapi.js";
import swaggerUi from "swagger-ui-express";
import companyRoutes from "./routes/company.routes.js";
import "./jobs/scheduler.js";
import compression from "compression";
import AppError from "./utils/AppError.js";

export const createApp = () => {
  const app = express();

  //cors config
  const allowedOrigins = new Set(
    [
      process.env.CORS_ORIGIN,
      "http://localhost:5173",
      "http://localhost:5001",
    ].filter(Boolean),
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          return callback(null, true);
        }

        callback(
          new AppError(
            `Origin ${origin} is not allowed by CORS`,
            403,
            "CORS_ERROR",
          ),
        );
      },
      credentials: true,
    }),
  );

  // helmet after cors so it doesn't interfere with CORS headers
  app.use(helmet());

  app.use(compression());

  // Body parsing middleware and request body size limits
  app.use(
    express.json({
      limit: "50kb",
    }),
  );

  //Reduce the size of HTTP responses before sending them to the client
  app.use(cookieParser());

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();

    if (!req.originalUrl.startsWith("/api/v1")) {
      return next();
    }

    res.on("finish", () => {
      logger.info("HTTP Request Completed", {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        statusCode: res.statusCode,
        duration: `${Date.now() - start}ms`,
        type: "finish",
      });
    });

    next();
  });

  // auth routes
  app.use("/api/v1/auth", authRoutes);

  // global rate limiting
  app.use("/api/v1", globalRateLimiter);

  // api routes
  app.use("/api/v1/super-admin", superadminRoutes);
  app.use("/api/v1/admins", adminRoutes);
  app.use("/api/v1/companies", companyRoutes);

  //swagger docs
  app.use("/sms/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  // error handler
  app.use(errorHandler);

  return app;
};
