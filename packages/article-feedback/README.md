# YouTrack Article Feedback App

[![Build Status][ci-img]][ci-project] [![official JetBrains project](https://jb.gg/badges/official-flat-square.svg)](https://github.com/JetBrains#jetbrains-on-github)

[Open in JetBrains Marketplace](https://plugins.jetbrains.com/plugin/25149-article-feedback/)


An app for leaving feedback for Article in YouTrack Knowledge Base.

### Contributing

As a custom app:
1. `npm install`
2. `npm run build` to build
3. `npm run pack` to pack
4. Upload `article-feedback.zip` to YouTrack as a custom app.

Via the marketplace:
1. Run this [configuration](https://teamcity.jetbrains.com/buildConfiguration/JetBrainsUi_YouTrackApps_ArticlesFeedback_Publish) to upload an update to JetBrains Marketplace.
2. Install the new version from [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/25149-article-feedback/).

[ci-project]: https://teamcity.jetbrains.com/project/JetBrainsUi_YouTrackApps_ArticleFeedback
[ci-img]:  https://teamcity.jetbrains.com/app/rest/builds/buildType:JetBrainsUi_YouTrackApps_ArticlesFeedback_Checks/statusIcon.svg
