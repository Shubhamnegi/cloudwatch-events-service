import * as dotenv from "dotenv";
import * as path from "path";
const envPath = path.join(__dirname, "../.env");
dotenv.config({
    path: envPath
})


import { postMessage } from "../util/slackUtil"

describe("Slack util test suite", () => {
    it("post message", async () => {
        const res = await postMessage("TEST_MESSAGE", { status: 1 });
        expect(res.response).toEqual("ok");
        expect(res.statusCode).toEqual(200);
    })
})