# Workflow management

Use this reference for administration and troubleshooting of pure workflows. For app-bundled rules, use the app CLI and
scope guidance instead of assuming that the legacy workflow UI is the deployment mechanism.

## Lifecycle

- Create JavaScript workflows under **Administration → Workflows** with the JavaScript editor. YouTrack generates the
  workflow `manifest.json`; add one or more rule modules before attaching it.
- Import and export one workflow per ZIP archive. Import makes the workflow available but does not attach it. Export is
  appropriate for transfer, support, or IDE editing.
- Attach a workflow to one or more projects to activate it. All rules start attached and enabled. A **requires setup** flag
  means declared requirements are missing in at least one project; inspect and apply the proposed fixes before testing.
- Enable or disable individual rules per project. Disabling every rule detaches that workflow from the project.
- Saving an edited workflow applies the update immediately to every attached project. Inspect usages and test impact before
  saving shared rules.
- Deleting a workflow or module requires the relevant **Update Project** permission in every attached project. Detach it
  first when removal is not intended to affect all current usages.

System administrators can manage all projects. Project administrators can import, attach, and manage workflows only for
projects they can view and update.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Need script diagnostics | Use `console.log`, `console.warn`, or `console.error`, then inspect the workflow editor Console. On YouTrack Server, entries also appear in `workflow.log`. |
| Cannot create an action rule | Its command/name conflicts with an existing command; choose another name. |
| Missing-field runtime error without **requires setup** | Declare the field in `requirements`. Requirement resolution in administration is case-insensitive, but JavaScript property access is case-sensitive. |
| Utility/custom script edit has no effect | Utility scripts reload when a referring script is updated or the application restarts; touch and save an importing rule. |
| Attached workflow is inactive | Check the workflow and rule project selectors, enabled state, and **requires setup** details. |

Requirements verify configuration; they do not grant permissions. Never use them as an access-control mechanism.
