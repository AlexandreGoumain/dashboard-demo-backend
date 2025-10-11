import { Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { InstanceService } from "../services/instanceService";
import { AuthRequest } from "../types";

const instanceService = new InstanceService();

export const getSuperInstances = asyncHandler(
    async (_req: AuthRequest, res: Response) => {
        const instances = await instanceService.listSuperInstances();

        res.json({
            success: true,
            data: instances,
        });
    }
);

