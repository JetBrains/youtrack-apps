# license

## Types

- [`LicenseInfo`](#licenseinfo)

## LicenseInfo

Information about the current YouTrack license.

Since: `2025.3.109000`  

Type: `Object`  

### Contents

#### Properties
- `youTrackVersion`
- `licenseUsername`
- `isCloud`
- `isFree`
- `isTrial`
- `currentUserCount`
- `maxUserCount`
- `currentAgentCount`
- `maxAgentCount`
- `currentDiskSpaceMb`
- `maxDiskSpaceMb`
- `expirationTimestamp`
- `instanceId`

### Examples

```javascript
const { licenseInfo } = require('@jetbrains/youtrack-scripting-api/license');
console.log('Current YouTrack version is: ' + licenseInfo.youTrackVersion);
console.log('The current user count in this YouTrack is: ' + licenseInfo.currentUserCount);
console.log('The ID of this YouTrack installation is: ' + licenseInfo.instanceId);
```

### Properties

| Name | Type | Description |
| --- | --- | --- |
| `youTrackVersion` | `string` | The YouTrack version. |
| `licenseUsername` | `string` | The license username associated with this YouTrack instance. |
| `isCloud` | `boolean` | 'True' if this YouTrack is a cloud one. |
| `isFree` | `boolean` | Indicates whether the instance is a free instance. |
| `isTrial` | `boolean` | 'True' if this YouTrack operates under a trial license. |
| `currentUserCount` | `number` | The maximum number of users allowed in the instance. |
| `maxUserCount` | `number` | The maximum number of users that the current license allows for this YouTrack. |
| `currentAgentCount` | `number` | The current number of agents in this YouTrack. |
| `maxAgentCount` | `number` | The maximum number of agents that the current license allows for this YouTrack. |
| `currentDiskSpaceMb` | `number` | The current amount of disk space (in megabytes) used by this YouTrack. |
| `maxDiskSpaceMb` | `number` | The maximum amount of disk space (in megabytes) allowed for this YouTrack. |
| `expirationTimestamp` | `number` | The license expiration timestamp in milliseconds since the Unix epoch. |
| `instanceId` | `string` | The unique identifier of this YouTrack installation. The value matches the `uuid` field returned by the `/api/config` REST endpoint. Available since 2026.3. |
