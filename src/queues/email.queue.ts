import { Queue } from "bullmq";
import { bullmqRedis } from "../config/redis.config.js";

export const emailQueue = new Queue("email", {
    connection: bullmqRedis
});