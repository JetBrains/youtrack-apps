---
to: "src/backend/router/project/demo/GET.ts"
---
import {Project} from "@/api/youtrack-types";

/**
 * @zod-to-schema
 */
export type ProjectDemoReq = {
    projectId: string;
    message?: string;
};

/**
 * @zod-to-schema
 */
export type ProjectDemoRes = {
    projectInfo: {
        id: string;
        name: string;
        shortName: string;
        description?: string;
    };
    message: string;
    timestamp: number;
};

export default function handle(ctx: CtxGet<ProjectDemoReq, ProjectDemoRes>): void {
    const message = ctx.request.getParameter('message') || 'Hello from project demo!';
    const project = ctx.project as Project;

    const response: ProjectDemoRes = {
        projectInfo: {
            id: project?.key || 'unknown',
            name: project?.name || 'Unknown Project',
            shortName: project?.shortName || 'UP',
            description: project?.description || 'No description'
        },
        message: message,
        timestamp: Date.now()
    };

    ctx.response.json(response);
}

export type Handle = typeof handle;

