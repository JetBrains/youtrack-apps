export function formatVotes(votes: number): string {
    if (votes === 1) {
        return 'vote';
    }
    return 'votes';
}
