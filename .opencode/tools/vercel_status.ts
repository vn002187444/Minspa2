export const description = 'Checks Vercel deployment status via the Vercel API. Requires VERCEL_TOKEN env var.';
export const args = {
  limit: {
    type: 'number',
    description: 'Number of recent deployments to fetch.',
    default: 5,
  },
};

export async function execute({ limit = 5 }: { limit?: number }) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return { success: false, error: 'VERCEL_TOKEN env var is required.' };
  }

  try {
    // Fetch project details first to get project ID
    const projectRes = await fetch('https://api.vercel.com/v9/projects?limit=1', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!projectRes.ok) {
      return { success: false, error: `Vercel API error (projects): ${projectRes.status} ${projectRes.statusText}` };
    }

    const projectData = await projectRes.json() as { projects?: Array<{ id: string; name: string }> };
    const project = projectData.projects?.[0];
    const projectId = project?.id;

    // Fetch recent deployments
    const deploysUrl = projectId
      ? `https://api.vercel.com/v6/deployments?limit=${limit}&projectId=${projectId}`
      : `https://api.vercel.com/v6/deployments?limit=${limit}`;

    const deploysRes = await fetch(deploysUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!deploysRes.ok) {
      return { success: false, error: `Vercel API error (deployments): ${deploysRes.status} ${deploysRes.statusText}` };
    }

    const deploysData = await deploysRes.json() as {
      deployments?: Array<{
        uid: string;
        name: string;
        url: string;
        state: string;
        createdAt: number;
        readyState?: string;
      }>;
    };

    const deployments = (deploysData.deployments || []).map(d => ({
      id: d.uid,
      name: d.name,
      url: d.url,
      state: d.readyState || d.state,
      created: new Date(d.createdAt).toISOString(),
    }));

    return {
      success: true,
      projectName: project?.name || 'unknown',
      deployments,
      message: `Found ${deployments.length} recent deployment(s) for project "${project?.name || 'unknown'}".`,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to fetch Vercel status' };
  }
}
