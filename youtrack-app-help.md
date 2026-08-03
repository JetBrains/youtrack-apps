youtrack-app

youtrack-app <entity> <action> [options]

Manage, configure, and debug YouTrack apps/workflows from an external development environment.
Configure YOUTRACK_HOST and YOUTRACK_API_TOKEN, or pass --host and --token to each command.

Common options:
  --host <url>                                                                  YouTrack instance URL. Overrides YOUTRACK_HOST.
  --token <token>                                                               Permanent token. Overrides YOUTRACK_API_TOKEN.
  --json                                                                        Print machine-readable JSON for supported commands.
  --yaml, --yml                                                                 Print machine-readable YAML for supported commands.
  --help, -h                                                                    Show help.
  --version                                                                     Print the CLI version.

App lifecycle:
  app upload [--directory DIR] [--open]
    Does: Uploads a local app package to the YouTrack instance.
    Args:
      --directory DIR is a local app directory or built package directory. Defaults to dist.
      --open opens app settings after upload.
  app download --app <app> [--output DIR] [--overwrite]
    Does: Downloads an app package from the YouTrack instance and extracts it locally.
    Args:
      <app> is an app ID or package name.
      --output DIR selects the local destination. Defaults to the current working directory.
      --overwrite replaces files in the destination directory.
  app validate [--directory DIR] [--manifest FILE] [--schema FILE]
    Does: Validates local app manifest files against the YouTrack app JSON schema without connecting to YouTrack.
    Args:
      --directory DIR is a local app directory. Defaults to dist.
      --manifest FILE validates a manifest file directly or overrides the default manifest file.
      --schema FILE overrides the default schema file.
  app enable --app <app> [--project <short-name>]
    Does: Enables an installed app globally in the YouTrack instance, or enables its usage for one project.
    Args:
      <app> is an app ID or package name.
      --project <short-name> is a project short name such as DEMO or JT.
  app disable --app <app> [--project <short-name>]
    Does: Disables an installed app globally in the YouTrack instance, or disables its usage for one project.
    Args:
      <app> is an app ID or package name.
      --project <short-name> is a project short name such as DEMO or JT.
  app attach --app <app> --project <short-name>
    Does: Attaches an installed app to a project in the YouTrack instance.
    Args:
      <app> is an app ID or package name.
      --project <short-name> is the project key, for example DEMO or JT.
  app detach --app <app> --project <short-name>
    Does: Detaches an installed app from a project in the YouTrack instance.
    Args:
      <app> is an app ID or package name.
      --project <short-name> is the project key to remove from app usages.

App details and configuration:
  app list [--skip N] [--limit N]
    Does: Lists installed apps visible to the token.
  app info --app <app>
    Does: Shows bounded app metadata and file keys for one installed app in the YouTrack instance.
    Args:
      <app> is an app ID or package name.
  app scripts --app <app> --file-key <file-key>
    Does: Shows one manifest, settings, entity extension, or script file from an installed app in the YouTrack instance.
    Args:
      <app> is an app ID or package name.
      <file-key> is listed by info. Use manifest, settings, entityExtensions, or a script ID.
  app usages --app <app> [--skip N] [--limit N]
    Does: Lists project usage records for one installed app, including nested requirement problems.
    Args:
      <app> is an app ID or package name.
  app settings --app <app> [--project <short-name>]
    Does: Reads global app settings or project-scoped settings from the YouTrack instance.
    Args:
      <app> is an app ID or package name.
      --project <short-name> is a project short name.
  app settings-set --app <app> [--project <short-name>] [--settings JSON] [--enabled true|false]
    Does: Updates app settings and/or enabled state in the YouTrack instance.
    Args:
      <app> is an app ID or package name.
      --project <short-name> writes project settings instead of global settings.
      --settings JSON is a JSON object string.
      --enabled true|false updates the enabled state.
  app logs --app <app> [--limit N]
    Does: Shows recent app-level log entries.
    Args:
      <app> is an app ID or package name.
      --limit N limits app log entries.
  app logs --app <app> --script <script> [--skip N] [--limit N]
    Does: Shows paged log entries for one script, module, or workflow rule.
    Args:
      <app> is an app ID or package name.
      --script <script> is a script, module, rule ID, rule name, or rule title.
      --skip N chooses the starting log entry.
      --limit N chooses the page size.
  app requirement-errors --app <app>
    Does: Shows broken requirement problems reported by app usages in the YouTrack instance.
    Args:
      <app> is an app ID or package name.
  app visibility --app <app> [--project <short-name>]
    Does: Shows read-only global or project visibility settings for one app.
    Args:
      <app> is an app ID or package name.
      --project <short-name> reads project-scoped app visibility.

Instance exploration:
  project list [--skip N] [--limit N]
    Does: Lists projects in the YouTrack instance with short names and IDs for later project-scoped commands.
  project info --project <project>
    Does: Shows identifying details for one project in the YouTrack instance.
    Args:
      <project> is an exact project ID or short name/key.
  project fields --project <project>
    Does: Returns the full issue fields JSON schema for one project in the YouTrack instance, including required fields and allowed values when available.
    Args:
      <project> is an exact project ID or short name/key.
  project apps --project <project> [--skip N] [--limit N]
    Does: Lists apps attached to one project in the YouTrack instance.
    Args:
      <project> is an exact project ID or short name/key.
  tag search [--query <query>] [--project <short-name>] [--skip N] [--limit N]
    Does: Searches visible usable tags in the YouTrack instance, optionally narrowed to tags relevant for one project.
    Args:
      --query <query> is optional tag name text.
      --project <short-name> narrows tags to one project.
  field values --project <short-name> --field <field> [--query <query>] [--skip N] [--limit N]
    Does: Searches values for one project custom field.
    Args:
      --query <query> is optional value text.
      --project <short-name> selects the project.
      --field <field> is a field ID or name.
  group list [--query <query>] [--skip N] [--limit N]
    Does: Searches user groups and project teams in the YouTrack instance with IDs.
    Args:
      --query <query> is an optional group search filter. When omitted, all visible groups are listed.
  group members [--group <group>] [--skip N] [--limit N]
    Does: Shows direct members of one user group or project team, or direct members for all paged groups when omitted.
    Args:
      --group <group> is an optional exact group ID or name.
      --skip N and --limit N apply when --group is omitted.
  user list [--query <query>] [--skip N] [--limit N]
    Does: Searches users in the YouTrack instance with login, ID, and display name.
    Args:
      --query <query> is an optional user search filter. When omitted, all visible users are listed.
  user info --user <user>
    Does: Shows profile details for one user in the YouTrack instance, including email, guest state, and user type when visible.
    Args:
      <user> is an exact user ID, login, username, or full name.

Dangerous commands:
  app delete --app <app> [--yes]
    Does: Danger: permanently deletes the installed app and everything app-related from the YouTrack instance.
    Args:
      <app> is an app ID or package name. Titles are not accepted.
      --yes skips the confirmation prompt.
