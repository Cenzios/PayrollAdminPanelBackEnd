import { Request, Response, NextFunction } from 'express';
interface JwtPayload {
    id: string;
    email: string;
    role: string;
}
declare global {
    namespace Express {
        interface Request {
            admin?: JwtPayload;
        }
    }
}
export declare const protectAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=adminAuth.middleware.d.ts.map