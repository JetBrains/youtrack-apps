export async function fetchVotes(host: YTPluginHost, issueID: string): Promise<number[]> {
    const issue = await host.fetchYouTrack(`issues/${issueID}/activitiesPage`, {
        query: {
            categories: 'VotersCategory',
            fields: 'activities(timestamp,added)',
            $top: 1000,
        },
    });

    return issue.activities.flatMap((activity: { timestamp: number; added: unknown[] }) => {
        return new Array(activity.added.length).fill(activity.timestamp);
    });
}
