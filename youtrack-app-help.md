youtrack-app

youtrack-app <command> [options]

Manage, configure, and debug YouTrack apps/workflows from an external development environment.
Configure YOUTRACK_HOST and YOUTRACK_API_TOKEN, or pass --host and --token to each command.

Common options:
  --host <url>                                                                  YouTrack instance URL. Overrides YOUTRACK_HOST.
  --token <token>                                                               Permanent token. Overrides YOUTRACK_API_TOKEN.
  --json                                                                        Print machine-readable JSON for commands that support it.
  --yaml                                                                        Print YAML for commands that support it.
  --skip N                                                                      Choose how many results to skip in commands that support paging.
  --limit N                                                                     Choose how many results to request in commands that support paging.

General commands:
  version
    Does: Prints the CLI version.

App lifecycle:
  upload <directory> [--open]
    Does: Uploads a local app package to the YouTrack instance.
    Args:
      <directory> is a local app directory or built package directory, usually dist.
      --open opens app settings after upload.
  download <app> [--output DIR] [--overwrite]
    Does: Downloads an app package from the YouTrack instance and extracts it locally.
    Args:
      <app> is an app ID or package name.
      --output DIR selects the local destination.
      --overwrite replaces files in the destination directory.
  validate [directory] [--manifest FILE] [--schema FILE]
    Does: Validates local app manifest files against the YouTrack app JSON schema without connecting to YouTrack.
    Args:
      [directory] is a local app directory.
      --manifest FILE validates a manifest file directly or overrides the default manifest file.
      --schema FILE overrides the default schema file.
  enable <app> [--project <short-name>]
    Does: Enables an installed app globally in the YouTrack instance, or enables its usage for one project.
    Args:
      <app> is an app ID or package name.
      --project <short-name> is a project short name such as DEMO or JT.
  disable <app> [--project <short-name>]
    Does: Disables an installed app globally in the YouTrack instance, or disables its usage for one project.
    Args:
      <app> is an app ID or package name.
      --project <short-name> is a project short name such as DEMO or JT.
  attach <app> --project <short-name>
    Does: Attaches an installed app to a project in the YouTrack instance.
    Args:
      <app> is an app ID or package name.
      --project <short-name> is the project key, for example DEMO or JT.
  detach <app> --project <short-name>
    Does: Detaches an installed app from a project in the YouTrack instance.
    Args:
      <app> is an app ID or package name.
      --project <short-name> is the project key to remove from app usages.

App details and configuration:
  list [--skip N] [--limit N]
    Does: Lists installed apps visible to the token.
  info <app>
    Does: Shows bounded app metadata and file keys for one installed app in the YouTrack instance.
    Args:
      <app> is an app ID or package name.
  scripts <app> <file-key>
    Does: Shows one manifest, settings, entity extension, or script file from an installed app in the YouTrack instance.
    Args:
      <app> is an app ID or package name.
      <file-key> is listed by info. Use manifest, settings, entityExtensions, or a script ID.
  usages <app> [--skip N] [--limit N]
    Does: Lists project usage records for one installed app, including nested requirement problems.
    Args:
      <app> is an app ID or package name.
  settings <app> [--project <short-name>]
    Does: Reads global app settings or project-scoped settings from the YouTrack instance.
    Args:
      <app> is an app ID or package name.
      --project <short-name> is a project short name.
  settings-set <app> [--project <short-name>] [--settings JSON] [--enabled true|false]
    Does: Updates app settings and/or enabled state in the YouTrack instance.
    Args:
      <app> is an app ID or package name.
      --project <short-name> writes project settings instead of global settings.
      --settings JSON is a JSON object string.
      --enabled true|false updates the enabled state.
  logs <app> [script] [--skip N] [--limit N]
    Does: Shows recent app-level log entries, or paged log entries for one script, module, or workflow rule.
    Args:
      <app> is an app ID or package name.
      [script] is a script, module, rule ID, rule name, or rule title.
  requirement-errors <app>
    Does: Shows broken requirement problems reported by app usages in the YouTrack instance.
    Args:
      <app> is an app ID or package name.
  visibility <app> [--project <short-name>]
    Does: Shows read-only global or project visibility settings for one app.
    Args:
      <app> is an app ID or package name.
      --project <short-name> reads project-scoped app visibility.

Instance exploration:
  project-list [--skip N] [--limit N]
    Does: Lists projects in the YouTrack instance with short names and IDs for later project-scoped commands.
  project-info <project> [--skip N] [--limit N]
    Does: Shows identifying details for one project in the YouTrack instance.
    Args:
      <project> is an exact project ID or short name/key.
  project-fields <project> [--skip N] [--limit N]
    Does: Returns the full issue fields JSON schema for one project in the YouTrack instance, including required fields and allowed values when available.
    Args:
      <project> is an exact project ID or short name/key.
  project-apps <project> [--skip N] [--limit N]
    Does: Lists apps attached to one project in the YouTrack instance.
    Args:
      <project> is an exact project ID or short name/key.
  tag-search <query> [--project <short-name>] [--skip N] [--limit N]
    Does: Searches visible usable tags in the YouTrack instance, optionally narrowed to tags relevant for one project.
    Args:
      <query> is tag name text.
      --project <short-name> narrows tags to one project.
  field-values <query> --project <short-name> --field <field> [--skip N] [--limit N]
    Does: Searches values for one project custom field.
    Args:
      <query> is value text.
      --project <short-name> selects the project.
      --field <field> is a field ID or name.
  group-list [query] [--skip N] [--limit N]
    Does: Searches user groups and project teams in the YouTrack instance with IDs.
    Args:
      [query] is an optional group search filter. When omitted, all visible groups are listed.
  group-members [group] [--skip N] [--limit N]
    Does: Shows direct members of one user group or project team, or direct members for all paged groups when omitted.
    Args:
      [group] is an optional exact group ID or name.
  user-list [query] [--skip N] [--limit N]
    Does: Searches users in the YouTrack instance with login, ID, and display name.
    Args:
      [query] is an optional user search filter. When omitted, all visible users are listed.
  user-info <user> [--skip N] [--limit N]
    Does: Shows profile details for one user in the YouTrack instance, including email, guest state, and user type when visible.
    Args:
      <user> is an exact user ID, login, username, or full name.

Dangerous commands:
  delete <app> [--yes]
    Does: Danger: permanently deletes the installed app and everything app-related from the YouTrack instance.
    Args:
      <app> is an app ID or package name. Titles are not accepted.
      --yes skips the confirmation prompt.
