import { Request, Response, NextFunction } from 'express';
interface JwtPayload {
    id: string;
    email: string;
    role: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare const requireSuperAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=requireSuperAdmin.middleware.d.ts.map