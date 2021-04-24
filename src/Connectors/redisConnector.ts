import { RedisClient } from "redis";
import { getRedisKey } from "../util/formatter";
import { getLogger } from "../util/loggerUtil";


export class LimtrayRedis {
    private static logger = getLogger("REDIS");
    private static client: RedisClient;

    public static startClient() {
        this.logger.info("Initiating connection for redis");
        this.client = new RedisClient({
            host: process.env.REDIS_HOST,
            port: +process.env.REDIS_PORT
        })

        this.client.on('error', (err) => {
            this.logger.error(err, "Error connecting redis");
        });
        this.client.on('connect', () => {
            this.logger.info("REDIS connected");
        })
    }

    public static getClient() {
        return this.client;
    }

    public static lockJob(jobname: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const key = getRedisKey(jobname);
            this.logger.debug("Creating lock for job: " + key);
            this.client.set(key, "1", "EX", 60, (err, reply) => {
                if (err) {
                    return reject(err);
                }
                this.logger.debug("Job locked for key: " + key);
                return resolve(reply);
            });
        });
    }

    public static isJobLocked(jobname: string) {
        return new Promise((resolve, reject) => {
            const key = getRedisKey(jobname);
            this.logger.debug("Checking job is locked for key: " + key);
            this.client.get(key, (err, reply) => {
                if (err) {
                    return reject(err);
                }
                this.logger.debug("job lock response for key: " + key + " " + reply);
                return resolve(reply);
            })
        });
    }
}