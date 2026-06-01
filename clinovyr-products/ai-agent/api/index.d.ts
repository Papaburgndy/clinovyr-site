declare const app: import("express").Express;
export default app;
/** Standalone health handler for Vercel edge routing if needed. */
export declare function healthHandler(_req: unknown, res: {
    status: (code: number) => {
        json: (body: unknown) => void;
    };
}): void;
