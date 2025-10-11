import { Response } from "express";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import { InstanceService } from "../services/instanceService";
import { AuthRequest } from "../types";

const instanceService = new InstanceService();

export const getSuperInstances = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        if (!req.user?.id) {
            throw new AppError(401, "Authentication required");
        }

        const instances = await instanceService.listSuperInstances(
            req.user.id
        );

        res.json({
            success: true,
            data: instances,
        });
    }
);
