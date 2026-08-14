# Context
Scripting context object contains entities that are useful during rule execution. It is passed as an argument to `guard`, `action`, `handle`, `onEnter`, and `onExit` functions.
See `## Specifics on Context` for context contents for every rule or custom endpoint type.

## Common contents
- `issue`: the object of the current rule. Its origin depends on the rule type. If several issues become rule objects at the same time, rules are executed for each issue separately in no specific order.
- `currentUser`: the subject of the current rule. Its origin also depends on the rule type.

The change initiator is inherited. If execution of a scheduled rule triggers an on-change rule, the `currentUser` for the on-change rule is inherited from the scheduled rule.

## Permission Delegation
If your workflow updates private custom fields or adds new custom field values, YouTrack performs these changes even when the current user does not have the `Update Issue Private Fields` or `Update Project` permissions.
In this case, the project administrator who implements this workflow is delegating their permission to any user who triggers this workflow rule.

## isMcpRequest
You can check whether an LLM performed a change through an MCP request by using isMcpRequest method of the context object in a workflow rule that gets triggered on changes.

```javascript
guard: (ctx) => ctx.isMcpRequest, // triggers only on MCP change requests
```

## Specifics on Context
This section what are the contents fo the `ctx` object and where do they come from for all script types.
- [On-change context](../script-types.md#on-change-rule): `ctx` for on-change rule.
- [Scheduled rule context](../script-types.md#on-schedule-rule): `ctx` for on-schedule rule.
- [Action rule context](../script-types.md#action-rule): `ctx` for action rule.
- [State machine context](../script-types.md#state-machine-rule): `ctx` for state-machine rule.
- [MCP tool context](../script-types.md#mcp-tool): `ctx` for mcp tools.
- [HTTP handler context](../script-types.md#http-handler): `ctx` for http handlers.
