export async function fetchVotes(host: YTPluginHost, issueID: string): Promise<number[]> {
    const issue = await host.fetchYouTrack(`issues/${issueID}/activitiesPage`, {
        query: {
            categories: 'VotersCategory',
            fields: 'activities(timestamp)',
            $top: 1000,
        },
    });

    return issue.activities.map((activity: { timestamp: number }) => activity.timestamp);
}
