import { Instance, User as PrismaUser } from "@prisma/client";
import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { LoginInput, RegisterInput } from "../types";
import { generateToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";

function serializeInstance(instance: Instance) {
    return {
        id: instance.id,
        name: instance.name,
        slug: instance.slug,
        industry: instance.industry ?? undefined,
        region: instance.region ?? undefined,
        plan: instance.plan ?? undefined,
        logoUrl: instance.logoUrl ?? null,
        createdAt: instance.createdAt.toISOString(),
        updatedAt: instance.updatedAt?.toISOString() ?? undefined,
    };
}

function serializeUser(user: PrismaUser & { instances: Instance[] }) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt?.toISOString() ?? undefined,
        instances: user.instances.map(serializeInstance),
    };
}

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

        const role = data.role ?? "USER";

        // Create user
        const createdUser = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role,
            },
        });

        // Generate token
        const token = generateToken({
            id: createdUser.id,
            email: createdUser.email,
            role: createdUser.role,
        });

        const user = await this.getProfile(createdUser.id);

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
            user: await this.getProfile(user.id),
            token,
        };
    }

    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                instances: true,
            },
        });

        if (!user) {
            throw new AppError(404, "User not found");
        }

        return serializeUser(user);
    }
}
