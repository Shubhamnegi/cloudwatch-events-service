import Slack from "slack-node"
const webhookUri = process.env.SLACK_WEBHOOK;

const slack = new Slack();
slack.setWebhook(webhookUri);
const SLACK_ENABLED = process.env.SLACK_ENABLED


// This can be tweeked as required, i wanted to have slack notification to keep track
// We can also use db instead
// To swith it off we can use a env var
export const postMessage = (message: string, details?: any): Promise<Slack.WebhookResponse> => {
    return new Promise((res, rej) => {
        if (SLACK_ENABLED === "false") {
            // slack is disabled
            return res(null);
        }

        const req: Slack.WebhookOptions = {
            channel: "#" + process.env.SLACK_CHANNEL,
            username: "cronbot",
            icon_emoji: ":ghost:",
            text: "[" + process.env.NODE_ENV + "] " + message,
        };
        if (details) {
            req.attachments = [{
                "blocks": [{
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: "```" + JSON.stringify(details) + "```"
                    }
                }]
            }]
        }
        slack.webhook(req, (err, response) => {
            if (err) {
                return rej(err);
            }
            return res(response);
        })
    })
}





