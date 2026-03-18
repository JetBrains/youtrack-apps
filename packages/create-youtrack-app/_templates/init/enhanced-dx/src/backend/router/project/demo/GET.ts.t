---
to: "src/backend/router/project/demo/GET.ts"
---
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

export default function handle(ctx: CtxGet<ProjectDemoRes, ProjectDemoReq, "project">): void {
    const message = ctx.request.getParameter('message') || 'Hello from project demo!';
    const project = ctx.project;

    ctx.response.json({
        projectInfo: {
            id: project.key,
            name: project.name,
            shortName: project.shortName,
            description: project.description,
        },
        message,
        timestamp: Date.now(),
    });
}

export type Handle = typeof handle;

