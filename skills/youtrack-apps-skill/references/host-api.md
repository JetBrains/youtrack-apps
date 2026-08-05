# Host API

The Host API is the supplementary API that supports communication between different parts of an app and YouTrack.

## Table of contents

- [How to Use the Host API](#how-to-use-the-host-api)
- [`YTApp` Object](#ytapp-object)
- [Host API Reference](#host-api-reference)
  - [`alert`](#alert)
  - [`fetchYouTrack`](#fetchyoutrack)
  - [`fetchApp`](#fetchapp)
  - [`navigation`](#navigation)
  - [`storage`](#storage)
  - [`requestParams`](#requestparams)

## How to Use the Host API

When you want your widget to send HTTP requests to YouTrack or communicate with it using any of the YouTrack APIs, you must include a script that registers the widget in YouTrack in the HTML code of the widget.

Example registration script:

```html
<script type="module">
    const host = await YTApp.register();
    host.alert('Hello world');
</script>
```

When you have registered the widget, you can use the Host API to send alerts in YouTrack, invoke functions implemented as custom HTTP handlers, or store app data locally in the browser.

## `YTApp` Object

YouTrack injects the `YTApp` object into the widget iframe. Use this object to register the widget with the host application and to read information about the widget context.

| Property or Method | Description |
| --- | --- |
| `register(plugin)` | Registers the widget in YouTrack and returns the Host API object. The optional `plugin` argument lets the widget expose callback functions to YouTrack. Example: `const host = await YTApp.register();` |
| `entity` | The YouTrack entity that hosts the widget, or `null` when the widget does not have an entity context. The object always contains `id` and `type`. Depending on the extension point, it can also contain additional fields such as an issue summary, project key, or article summary. |
| `me` | The current user in the widget context. This object contains basic user profile fields such as `id`, `login`, `name`, `avatarUrl`, and `userType`. To read additional user data, use the YouTrack REST API with `host.fetchYouTrack()` or call a custom HTTP handler. |
| `locale` | The locale of the current YouTrack user interface. |
| `widget` | The current widget identifiers, including `id` and `appId`. |

## Host API Reference

### `alert`

This method allows you to send an alert message to YouTrack from within an app.

#### Parameters

| Parameter | Type | Description | Required |
| --- | --- | --- | --- |
| `message` | `String` | The text of the alert message. | Yes |

Example:

```javascript
const host = await YTApp.register();
host.alert('Hello world');
```

### `fetchYouTrack`

This method lets the app use the YouTrack REST API.

> Note: The `fetchYouTrack` method sends requests to YouTrack REST API endpoints under `/api`. It does not send requests to Hub REST API endpoints. To work with users, groups, and access management in YouTrack 2026.1 and later, use the corresponding YouTrack REST API endpoints. For Hub REST API calls, use `fetchHub()` where this method is available.

#### Parameters

| Parameter | Type | Description | Required |
| --- | --- | --- | --- |
| `relativeURL` | `String` | The relative URL to the REST API endpoint. | Yes |
| `requestParams` | `RequestParams` | Optional fetch parameters. For additional information, see [`requestParams`](#requestparams). | Yes(can be {}) |

Example:

```javascript
const host = await YTApp.register();
const user = await host.fetchYouTrack(`users/${YTApp.entity.id}?fields=id,login,name`);
```

Example with optional query parameters:

```javascript
const ytResponse = await host.fetchYouTrack(
    'users',
    {
        query: {
            fields: 'id,login,email'
        }
    }
);
```

> Warning: Requests That Require User Confirmation
>
> When a widget sends a REST request that can change or delete data, YouTrack can ask the user to confirm the request before it is sent. This confirmation is stored for the current user only.
>
> If the widget is available to a broad audience, any user who can open the widget can confirm these requests on their own behalf. Configure app visibility and widget permissions so widgets that send such requests are available only to users who are expected to perform these actions.

### `fetchApp`

This method lets the app communicate with the custom HTTP handler and invoke its methods. The `fetchApp` method is similar to the `fetchYouTrack` method, but has an additional `scope` parameter. This parameter lets you indicate whether the request should be made to a scoped or global endpoint.

> Important: Always pass the second `requestParams` argument to `host.fetchApp`.
> For global GET handlers with no query/body, call `host.fetchApp('handler/path', {})`.
> Do not call `host.fetchApp('handler/path')`; some YouTrack host runtimes read `requestParams.scope`
> and will throw when the argument is omitted

The `fetchApp` method parses JSON and returns a ready-to-use response object.

#### Parameters

| Parameter | Type | Description | Required |
| --- | --- | --- | --- |
| `relativeURL` | `String` | The relative URL to the custom HTTP endpoint. For more details, see HTTP Handlers. |
| `requestParams` | `RequestParams` | Optional fetch parameters. For details, see [`requestParams`](#requestparams). |

Example:

```javascript
const host = await YTApp.register();
const appResponse = await host.fetchApp(
    'backend/demo',
    {
        scope: true
    }
);
```

Example GET request with query parameters:

```javascript
const appResponse = await host.fetchApp(
    'backend/demo',
    {
        query: {
            key: '12345',
            count: 20,
            filter: true
        }
    }
);
```

Example POST request with body:

```javascript
const appResponse = await host.fetchApp(
    'backend/demo',
    {
        method: 'POST',
        body: {
            test: 'test'
        }
    }
);
```

### `navigation`

The Host API provides the `navigation` object to full-page widgets. This object lets a widget read and update the part of the page URL that belongs to the app. Use it when your widget has internal navigation and users need to open, share, or return to a specific screen.

The `navigation` object is only available for widgets that use full-page extension points, such as `MAIN_MENU_ITEM` and `ADMINISTRATION_MENU_ITEM`.

The methods provided by the `navigation` object are asynchronous and return promises.

For a working example, see the full-page widget in the built-in YouTrack Demo App.

The app-controlled part of the URL is represented by the following object:

```typescript
type AppLocation = {
    pathname: string;
    search: string;
    hash: string;
};
```

| Property | Type | Description |
| --- | --- | --- |
| `pathname` | `String` | The custom path segment that follows the part of the app URL controlled by YouTrack. |
| `search` | `String` | The query string without the leading `?` character. If the app URL has no query string, this property is an empty string. |
| `hash` | `String` | The fragment identifier without the leading `#` character. If the app URL has no fragment identifier, this property is an empty string. |

#### `getAppLocation`

```typescript
host.navigation.getAppLocation(): Promise<AppLocation>
```

Returns an `AppLocation` object that represents the current app URL.

Example that reads query parameters from the current app URL:

```javascript
const host = await YTApp.register();
const location = await host.navigation.getAppLocation();
const params = new URLSearchParams(location.search);
const requestType = params.get('requestType');
```

#### `updateAppLocation`

```typescript
host.navigation.updateAppLocation(location: Partial<AppLocation>): Promise<void>
```

Updates the app URL and adds a new entry to the browser history. Use this method when the user navigates to another screen inside the widget and the browser Back button should return to the previous app URL.

You can update `pathname`, `search`, and `hash` independently. Properties that are not specified in the `location` object keep their current values.

##### Parameters

| Parameter | Type | Description | Required |
| --- | --- | --- | --- |
| `location` | `Partial<AppLocation>` | The app URL properties to update. This object can contain any combination of `pathname`, `search`, and `hash`. | Yes |

Example that updates the app URL when a user opens a specific screen inside the widget:

```javascript
const host = await YTApp.register();
const params = new URLSearchParams();
params.set('requestType', 'vacation');

await host.navigation.updateAppLocation({
    pathname: '/requests/new',
    search: params.toString()
});
```

#### `replaceAppLocation`

```typescript
host.navigation.replaceAppLocation(location: Partial<AppLocation>): Promise<void>
```

Replaces the current app URL without adding a new entry to the browser history. Use this method when you need to normalize or clean up the URL without changing how the browser Back button behaves.

You can replace `pathname`, `search`, and `hash` independently. Properties that are not specified in the `location` object keep their current values.

##### Parameters

| Parameter | Type | Description | Required |
| --- | --- | --- | --- |
| `location` | `Partial<AppLocation>` | The app URL properties to replace. This object can contain any combination of `pathname`, `search`, and `hash`. | Yes |

Example that removes a temporary query parameter from the current app URL:

```javascript
const host = await YTApp.register();
const location = await host.navigation.getAppLocation();
const params = new URLSearchParams(location.search);
params.delete('temporaryToken');

await host.navigation.replaceAppLocation({
    search: params.toString()
});
```

#### `onAppLocationChange`

To handle changes to the app URL, pass the `onAppLocationChange` callback to `YTApp.register()`.

This callback is invoked when the app URL changes, including cases when the user navigates with the browser Back and Forward buttons.

```javascript
const host = await YTApp.register({
    onAppLocationChange: (location) => {
        renderScreen(location.pathname, location.search, location.hash);
    }
});
```

### `storage`

> Note: Available since YouTrack version 2026.2.

The Host API provides the `storage` object for app data stored locally in the browser. Use it for values that should remain in the user's browser, such as the last active tab, UI preferences, dismissed hints, draft text, or cached data that lets the widget render immediately while fresh data loads.

The methods provided by the `storage` object are asynchronous and return promises. This is because widget code runs in a sandboxed iframe and storage operations are handled by the host application.

The storage area is isolated per app. All widgets from the same app share one storage area, while widgets from other apps cannot read or modify its values. Coordinate key names between widgets from the same app to avoid overwriting shared values accidentally.

Keys and values are strings. To store structured data, serialize it with `JSON.stringify()` and parse it after reading. The total storage size for one app is limited to 1 MB. This quota counts the byte size of both keys and values.

The data is stored locally in the browser and is not a replacement for server-side app storage. It is not tied to a YouTrack user account, so do not use it for secrets or values that must be protected by YouTrack permissions. Use app global storage or extension properties for data that must be available to backend scripts, other users, or the same user in another browser.

The `storage` object provides persistent storage only. Session storage and cookies are not exposed to app widgets.

Keys that start with `__meta:` are reserved for internal use. Operations with reserved keys throw or reject with `InvalidAccessError`. Write operations that exceed the app quota reject with `QuotaExceededError`.

```typescript
type AppStorage = {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    getKeys(): Promise<string[]>;
};
```

| Method | Description |
| --- | --- |
| `getItem(key)` | Returns the stored value for the key, or `null` when the key does not exist. |
| `setItem(key, value)` | Stores a string value for the key. |
| `removeItem(key)` | Removes the stored value for the key. If the key does not exist, the operation has no effect. |
| `clear()` | Removes all values from the app storage area. |
| `getKeys()` | Returns all keys stored by the app. |

Example that stores and reads widget settings:

```javascript
const host = await YTApp.register();

const settings = {
    theme: 'dark',
    collapsedGroups: ['done', 'archived']
};

await host.storage.setItem('settings', JSON.stringify(settings));

const rawSettings = await host.storage.getItem('settings');
const restoredSettings = rawSettings ? JSON.parse(rawSettings) : {};
```

### `requestParams`

The `requestParams` object is an extended version of the Ring UI `RequestParams`, which builds upon the Fetch API's `RequestInit` object with a few key differences.

Unlike `RequestInit` in the standard Fetch API, `RequestParams`:

- Includes the `query` parameter to pass the query parameters for the call.
- Automatically provides the necessary call header: `"Accepts": "application/json"`.
- Automatically stringifies the `body` parameter.

In addition to the base properties supported by the `RequestInit` object, `requestParams` supports the following supplemental properties:

| Property | Description |
| --- | --- |
| `query` | A JavaScript object containing key-value pairs that are used as query parameters for the HTTP request. |
| `scope` | A Boolean property that indicates whether the request should be made to a scoped or global endpoint. Pass `true` for scoped handlers. This ensures that the scope entity will be available for the handler from the context. |

Example `query` object:

```javascript
const query = {
    key: '12345',
    shelterID: 'abc00',
    count: 20,
    animals: true
};
```

Example scoped app request:

```javascript
// appResponse is a parsed JSON:
const appResponse = await host.fetchApp('backend/demo', {scope: true});
console.log('test', appResponse.test);
```
