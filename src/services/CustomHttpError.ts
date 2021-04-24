export class CustomHttpError {
    public error: Error;
    public status: number;
    public message: string;
    public stack?: string;

    constructor(status: number, error: Error) {
        this.status = status;
        this.error = error;
        this.message = error.message;
        this.stack = error.stack;
    }
}
