import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { LoginInput, RegisterInput } from "../types";
import { generateToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";

export class AuthService {
    async register(data: RegisterInput) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError(409, "User with this email already exists");
        }

        // Hash password
        const hashedPassword = await hashPassword(data.password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });

        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        return { user, token };
    }

    async login(data: LoginInput) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw new AppError(401, "Invalid credentials");
        }

        // Compare password
        const isPasswordValid = await comparePassword(
            data.password,
            user.password
        );

        if (!isPasswordValid) {
            throw new AppError(401, "Invalid credentials");
        }

        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
            },
            token,
        };
    }

    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new AppError(404, "User not found");
        }

        return user;
    }
}
