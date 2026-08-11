youtrack-app

youtrack-app <entity> <action> [options]

Manage, configure, and debug YouTrack apps and workflows from an external development environment.
Set YOUTRACK_HOST and YOUTRACK_API_TOKEN, or provide --host and --token with each command.

Common options:
  --host <url>                                                                  YouTrack URL. Overrides YOUTRACK_HOST.
  --token <token>                                                               Permanent token. Overrides YOUTRACK_API_TOKEN.
  --json                                                                        Output results as machine-readable JSON, when supported.
  --yaml, --yml                                                                 Output results as machine-readable YAML, when supported.
  --help, -h                                                                    Show help information.
  --version                                                                     Show the CLI version.

App lifecycle:
  app upload [--directory DIR] [--open]
    Uploads an app package from the local filesystem to YouTrack.
    Options:
      --directory DIR is a local app directory or built package directory. Defaults to dist.
      --open opens app settings after upload.
  app download --app <app> [--output DIR] [--overwrite]
    Downloads an app package from YouTrack and extracts it locally.
    Options:
      <app> is an app ID or package name.
      --output DIR selects the local destination. Defaults to the current working directory.
      --overwrite replaces files in the destination directory.
  app validate [--directory DIR] [--manifest FILE] [--schema FILE]
    Validates local app manifest files against the YouTrack app JSON schema without connecting to YouTrack.
    Options:
      --directory DIR is a local app directory. Defaults to dist.
      --manifest FILE validates a manifest file directly or overrides the default manifest file.
      --schema FILE overrides the default schema file.
  app enable --app <app> [--project <key>]
    Enables an installed app globally or for a specific project.
    Options:
      <app> is an app ID or package name.
      --project <key> is a project short name such as DEMO or JT.
  app disable --app <app> [--project <key>]
    Disables an installed app globally in YouTrack, or disables its usage for one project.
    Options:
      <app> is an app ID or package name.
      --project <key> is a project short name such as DEMO or JT.
  app attach --app <app> --project <key>
    Attaches an installed app to a project in YouTrack.
    Options:
      <app> is an app ID or package name.
      --project <key> is the project key, for example DEMO or JT.
  app detach --app <app> --project <key>
    Detaches an installed app from a project in YouTrack.
    Options:
      <app> is an app ID or package name.
      --project <key> is the project key to remove from app usages.

App details and configuration:
  app list [--skip N] [--limit N]
    Lists installed apps visible to the token.
  app info --app <app>
    Shows app metadata and file keys for an installed app.
    Options:
      <app> is an app ID or package name.
  app scripts --app <app> --file-key <file-key>
    Shows one manifest, settings, entity extension, or script file from an installed app in YouTrack.
    Options:
      <app> is an app ID or package name.
      <file-key> is listed by info. Use manifest, settings, entityExtensions, or a script ID.
  app usages --app <app> [--skip N] [--limit N]
    Lists the projects that use the app and shows any requirement problems nested under each project.
    Options:
      <app> is an app ID or package name.
  app settings --app <app> [--project <key>]
    Reads global app settings or project-scoped settings from YouTrack.
    Options:
      <app> is an app ID or package name.
      --project <key> is a project short name.
  app settings-set --app <app> [--project <key>] [--settings JSON] [--enabled true|false]
    Updates app settings, changes whether the app is enabled, or both.
    Options:
      <app> is an app ID or package name.
      --project <key> writes project settings instead of global settings.
      --settings JSON is a JSON object string.
      --enabled true|false updates the enabled state.
  app logs --app <app> [--limit N]
    Shows recent app-level log entries.
    Options:
      <app> is an app ID or package name.
      --limit N limits app log entries.
  app logs --app <app> --script <script> [--skip N] [--limit N]
    Shows paged log entries for one script, module, or workflow rule.
    Options:
      <app> is an app ID or package name.
      --script <script> is a script, module, rule ID, rule name, or rule title.
      --skip N specifies the number of entries to skip.
      --limit N chooses the page size.
  app requirement-errors --app <app>
    Shows requirement errors reported by app usages in YouTrack.
    Options:
      <app> is an app ID or package name.
  app visibility --app <app> [--project <key>]
    Shows global or project visibility settings for an app.
    Options:
      <app> is an app ID or package name.
      --project <key> reads project-scoped app visibility.

YouTrack Exploration:
  project list [--skip N] [--limit N]
    Lists projects in YouTrack with short names and IDs for later project-scoped commands.
  project info --project <project>
    Shows details for one project in YouTrack.
    Options:
      <project> is an exact project ID or short name/key.
  project fields --project <project>
    Returns the issue-fields JSON schema for a project, including field definitions and required fields. Allowed-value lists may be capped; use "field values" to find actual custom-field values.
    Options:
      <project> is an exact project ID or short name/key.
  project apps --project <project> [--skip N] [--limit N]
    Lists apps attached to one project in YouTrack.
    Options:
      <project> is an exact project ID or short name/key.
  tag search [--query <query>] [--project <key>] [--skip N] [--limit N]
    Searches available tags in YouTrack, optionally narrowed to tags relevant for one project.
    Options:
      --query <query> is optional tag name text.
      --project <key> narrows tags to one project.
  field values --project <key> --field <field> [--query <query>] [--skip N] [--limit N]
    Searches and paginates actual custom-field values for a project. Use it instead of "project fields" when a field has more values than the schema lists.
    Options:
      --query <query> is optional value text.
      --project <key> selects the project.
      --field <field> is a field ID or name.
  group list [--query <query>] [--skip N] [--limit N]
    Searches user groups and project teams in YouTrack with IDs.
    Options:
      --query <query> is an optional group search filter. When omitted, all visible groups are listed.
  group members [--group <group>] [--skip N] [--limit N]
    Lists the direct members of a user group or project team. If you omit --group, the command lists members for all groups in the requested page.
    Options:
      --group <group> is an optional exact group ID or name.
      --skip N and --limit N apply when --group is omitted.
  user list [--query <query>] [--skip N] [--limit N]
    Searches users in YouTrack with login, ID, and display name.
    Options:
      --query <query> is an optional user search filter. When omitted, all visible users are listed.
  user info --user <user>
    Shows profile details for one user in YouTrack, including email, guest status, and user type when visible.
    Options:
      <user> is an exact user ID, login, username, or full name.

Raw REST API:
  rest request --path <path> [--method METHOD] [--body JSON] [--header name:value] [--yes]
    Makes an authenticated request to a relative path on the configured YouTrack host.
    Options:
      --path <path> is a relative REST path, including any query string.
      --method defaults to GET. Supported methods are GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS.
      --yes is required for DELETE requests.
      --body JSON sends a JSON request body.
      --header name:value adds a request header and may be repeated.
      See https://www.jetbrains.com/help/youtrack/devportal/rest-api-reference.html for available paths and payloads.

Dangerous commands:
  app delete --app <app> [--yes]
    Danger: Permanently deletes the installed app and all associated data from YouTrack.
    Options:
      <app> is an app ID or package name. Titles are not accepted.
      --yes skips the confirmation prompt.