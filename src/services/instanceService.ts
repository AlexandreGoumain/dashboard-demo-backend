import prisma from "../config/database";
import { ProjectInstance } from "../types";

export class InstanceService {
    async listSuperInstances(userId: string): Promise<ProjectInstance[]> {
        const instances = await prisma.instance.findMany({
            where: {
                members: {
                    some: { id: userId },
                },
            },
            orderBy: { name: "asc" },
        });

        return instances.map((instance) => ({
            id: instance.id,
            name: instance.name,
            slug: instance.slug,
            industry: instance.industry ?? undefined,
            region: instance.region ?? undefined,
            plan: instance.plan ?? undefined,
            logoUrl: instance.logoUrl ?? null,
            createdAt: instance.createdAt.toISOString(),
            updatedAt: instance.updatedAt?.toISOString() ?? undefined,
        }));
    }
}
