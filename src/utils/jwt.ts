import jwt, {
    JsonWebTokenError,
    TokenExpiredError,
    type SignOptions,
} from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { JwtPayload } from "../types";

export const generateToken = (payload: JwtPayload): string => {
    const options: SignOptions = {
        expiresIn: env.jwt.expiresIn as any,
    };

    return jwt.sign(payload, env.jwt.secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, env.jwt.secret) as JwtPayload;
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            throw new AppError(401, "Token expired");
        }

        if (error instanceof JsonWebTokenError) {
            throw new AppError(401, "Invalid token");
        }

        throw error;
    }
};
