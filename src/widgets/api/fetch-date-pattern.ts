export async function fetchDatePattern(host: YTPluginHost): Promise<string> {
    const profile = await host.fetchYouTrack('users/me', {
        query: {
            fields: 'profiles(general(dateFieldFormat(datePattern)))',
        },
    });

    return profile.profiles.general.dateFieldFormat.datePattern;
}
