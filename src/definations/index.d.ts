import Logger from "bunyan"
import { Request } from "express"


export type CustomRequest = Request & {
    log: Logger
}

export type EventJob = {
    name: string,
    type: string,
    callbackUrl?: string,
    payload?: any,
    topic?: string,
    queue?: string,
    interval: string,
    ownerSlackUsername?: string
}

export type NotificationTypes = "QUEUE" | "TOPIC" | "HTTP_CALLBACK";