# http

Contains definitions for objects and classes that exchange and transfer data over HTTP. The main class is Connection.

## Types
- [`Connection`](#connection)
- [`REQUEST_TYPES`](#request_types)
- [`Response`](#response)

## Connection

Main class that is used to establish a connection and send requests to target sites.

Type: `Object`  

### Contents

#### Properties
- `url`
- `headers`

#### Method Groups
- [Methods](#methods)
  - [`addHeader`](#addheader)
  - [`basicAuth`](#basicauth)
  - [`bearerAuth`](#bearerauth)
  - [`setHeader`](#setheader)
- [Async Methods](#async-methods)
  - [`deleteAsync`](#deleteasync)
  - [`doAsync`](#doasync)
  - [`getAsync`](#getasync)
  - [`patchAsync`](#patchasync)
  - [`postAsync`](#postasync)
  - [`putAsync`](#putasync)
- [Sync Methods](#sync-methods)
  - [`connectSync`](#connectsync)
  - [`deleteSync`](#deletesync)
  - [`doSync`](#dosync)
  - [`getSync`](#getsync)
  - [`headSync`](#headsync)
  - [`optionsSync`](#optionssync)
  - [`patchSync`](#patchsync)
  - [`postSync`](#postsync)
  - [`putSync`](#putsync)

### Examples

```javascript
// Gets the content of a PasteBin paste, assuming that we have received its key (`pasteBinKey`) in a prior request.
const connection = new http.Connection('http://pastebin.com/raw/');
connection.addHeader({name: 'Content-Type', value: 'text/plain'});
const response = connection.getSync(pasteBinKey, '');
if (response && response.code === 200) {
  let text = '';
  response.headers.forEach(function(header) {
    text += header.name + ': ' + header.value + '\n';
  });
  text += '\n' + response.response;
  issue.addComment(text);
}
```

### Properties

| Name | Type | Description |
| --- | --- | --- |
| `url` | `string` | The URL of the target site for the connection. Can be empty, as you can specify the URI as a parameter for any request method. |
| `headers` | `Array.<{name: String, value: String}>` | A list of headers. |

### Methods

#### addHeader

Adds a new header to the current connection.
The `value` parameter can also contain references to secrets stored in the settings for a YouTrack app.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `header` | `Object`, `string` | A header object with the structure {name: string, value: string}. If the value parameter is specified separately, the provided string is used as the name of the header. |
| `value` | `string` | The value that is assigned to the header. Only considered when the first parameter is specified as a string. |

##### Returns

Return type: `Connection`.

The current connection object.

#### basicAuth

Adds an authorization header with the value returned by the Base64.encode(login + ':' + password) function.
The `password` parameter also accepts references to secrets stored in the settings for a YouTrack app.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `login` | `String` | The login to use for the authorization request. |
| `password` | `String` | The password to use for the authorization request. |

##### Returns

Return type: `Connection`.

The current connection object.

#### bearerAuth

Adds an authorization header with the value in "Bearer" format ('Bearer ' + token).
The `token` parameter also accepts references to secrets stored in the settings for a YouTrack app.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `token` | `String` | The token to use for the authorization request. |

##### Returns

Return type: `Connection`.

The current connection object.

#### setHeader

Sets a header to the current connection. If the specified header already exists, its value is updated.
The `value` parameter can also contain references to secrets stored in the settings for a YouTrack app.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `header` | `Object`, `string` | A header object with the structure {name: string, value: string}. If the value parameter is specified separately, the provided string is used as the name of the header. |
| `value` | `string` | The value that is assigned to the header. Only considered when the first parameter is specified as a string. |

##### Returns

Return type: `Connection`.

The current connection object.

### Async Methods

#### deleteAsync

Schedules an asynchronous DELETE request.

Since: `2026.2`  

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `string` | The request URI. |
| `queryParams` | `Array`, `Object` | The query parameters. |
| `handlerName` | `string` | The name of the async function to call with the response. |

#### doAsync

Schedules an asynchronous HTTP request. The request is executed after the current transaction commits,
and the response is passed to the named async function handler.
The handler must be declared in the `asyncFunctions` property of the rule or HTTP handler.
Inside the handler, the response is available as the `response` property of the context object.
It provides the same properties and methods as Response.

Since: `2026.2`  

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `requestType` | `string` | A valid HTTP request type. |
| `uri` | `string` | A relative URI. |
| `queryParams` | `Array.<{name: String, value: String}>`, `Object` | The query parameters. |
| `payload` | `string`, `Object` | The payload to be sent in the request. |
| `handlerName` | `string` | The name of the async function to call with the response. |

##### Examples

```javascript
const entities = require('@jetbrains/youtrack-scripting-api/entities');
const http = require('@jetbrains/youtrack-scripting-api/http');

exports.rule = entities.Issue.onChange({
  title: 'Fetch external data',
  action: function (ctx) {
    const connection = new http.Connection('https://api.example.com');
    connection.getAsync('items/' + ctx.issue.id, null, 'onResponse');
  },
  asyncFunctions: {
    onResponse: function (ctx) {
      if (ctx.response.isSuccess) {
        const item = ctx.response.json();
        console.log('Fetched ' + item.name);
      }
    }
  }
});
```

#### getAsync

Schedules an asynchronous GET request.

Since: `2026.2`  

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `string` | The request URI. |
| `queryParams` | `Array`, `Object` | The query parameters. |
| `handlerName` | `string` | The name of the async function to call with the response. |

#### patchAsync

Schedules an asynchronous PATCH request.

Since: `2026.2`  

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `string` | The request URI. |
| `queryParams` | `Array`, `Object` | The query parameters. |
| `payload` | `string`, `Object` | The payload to be sent in the request. |
| `handlerName` | `string` | The name of the async function to call with the response. |

#### postAsync

Schedules an asynchronous POST request.

Since: `2026.2`  

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `string` | The request URI. |
| `queryParams` | `Array`, `Object` | The query parameters. |
| `payload` | `string`, `Object` | The payload to be sent in the request. |
| `handlerName` | `string` | The name of the async function to call with the response. |

#### putAsync

Schedules an asynchronous PUT request.

Since: `2026.2`  

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `string` | The request URI. |
| `queryParams` | `Array`, `Object` | The query parameters. |
| `payload` | `string`, `Object` | The payload to be sent in the request. |
| `handlerName` | `string` | The name of the async function to call with the response. |

### Sync Methods

#### connectSync

Executes a synchronous CONNECT request.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `string` | request URI. The complete URL is a concatenation of the string that is passed to the URL parameter in the Connection constructor and this string. If the URL parameter in the Connection constructor is empty, specify the absolute URL of the target site. |
| `queryParams` | `Array.<{name: String, value: String}>`, `Object` | The query parameters. If an object is passed, its keys are considered to be parameter names. |

##### Returns

Return type: `Response`.

An object that represents an HTTP response.

#### deleteSync

Executes a synchronous DELETE request.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `string` | The request URI. The complete URL is a concatenation of the string that is passed to the URL parameter in the Connection constructor and this string. If the URL parameter in the Connection constructor is empty, specify the absolute URL of the target site. |
| `queryParams` | `Array.<{name: String, value: String}>`, `Object` | The query parameters. If an object is passed, its keys are considered to be parameter names. |

##### Returns

Return type: `Response`.

An object that represents an HTTP response.

#### doSync

Sends a synchronous HTTP request. Note that instead of passing a proper
request type with this method, there are dedicated methods that correspond to each
request type that you can call directly. For example, getSync or postSync.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `requestType` | `string` | A valid HTTP request type. For a list of supported request types, see REQUEST_TYPES. |
| `uri` | `string` | A relative URI. The complete URL is a concatenation of the string that is passed to the URL parameter in the Connection constructor and this string. If the URL parameter in the Connection constructor is empty, specify the absolute URL of the target site. |
| `queryParams` | `Array.<{name: String, value: String}>` | The query parameters. |
| `payload` | `string`, `Array`, `Object` | The payload to be sent in the request. |

##### Returns

Return type: `Response`.

An object that represents the HTTP response.

#### getSync

Executes a synchronous GET request.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `String` | The request URI. The complete URL is a concatenation of the string that is passed to the URL parameter in the Connection constructor and this string. If the URL parameter in the Connection constructor is empty, specify the absolute URL of the target site. |
| `queryParams` | `Array.<{name: String, value: String}>`, `Object` | The query parameters. If an object is passed, its keys are considered to be parameter names. |

##### Returns

Return type: `Response`.

An object that represents an HTTP response.

#### headSync

Executes a synchronous HEAD request.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `string` | The request URI. The complete URL is a concatenation of the string that is passed to the URL parameter in the Connection constructor and this string. If the URL parameter in the Connection constructor is empty, specify the absolute URL of the target site. |
| `queryParams` | `Array.<{name: String, value: String}>`, `Object` | The query parameters. If an object is passed, its keys are considered to be parameter names. |

##### Returns

Return type: `Response`.

An object that represents an HTTP response.

#### optionsSync

Executes a synchronous OPTIONS request.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `string` | request URI. The complete URL is a concatenation of the string that is passed to the URL parameter in the Connection constructor and this string. If the URL parameter in the Connection constructor is empty, specify the absolute URL of the target site. |
| `queryParams` | `Array.<{name: String, value: String}>`, `Object` | The query parameters. If an object is passed, its keys are considered to be parameter names. |

##### Returns

Return type: `Response`.

An object that represents an HTTP response.

#### patchSync

Executes a synchronous PATCH request.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `string` | The request URI. The complete URL is a concatenation of the string that is passed to the URL parameter in the Connection constructor and this string. If the URL parameter in the Connection constructor is empty, specify the absolute URL of the target site. |
| `queryParams` | `Array.<{name: String, value: String}>`, `Object` | The query parameters. If an object is passed, its keys are considered to be parameter names. |
| `payload` | `string` | The payload to be sent in the request. |

##### Returns

Return type: `Response`.

An object that represents an HTTP response.

#### postSync

Executes a synchronous POST request.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `string` | The request URI. The complete URL is a concatenation of the string that is passed to the URL parameter in the Connection constructor and this string. If the URL parameter in the Connection constructor is empty, specify the absolute URL of the target site. |
| `queryParams` | `Array.<{name: String, value: String}>`, `Object` | The query parameters. If an object is passed, its keys are considered to be parameter names. If the payload parameter is empty, the query parameters are passed as a form entity. |
| `payload` | `string`, `Object` | The payload to be sent in the request.  For posting attachment files from YouTrack to a third-party application, pass the payload as an object, set its `type` value to 'multipart/form-data', and pass the attachments in `parts`. For each part, `name`, `size`, `fileName`, and `content` values are required. See an example of such a request below. For details, see [Posting Binary Content with multipart/form-data Type](https://www.jetbrains.com/help/youtrack/devportal/JS-Workflow-REST-API.html#post-multipart) |

##### Returns

Return type: `Response`.

An object that represents an HTTP response.

##### Examples

```javascript
const attachment = issue.attachments.first();
connection.postSync('issues/' + issue.id + '/attachments', [], {
    type: 'multipart/form-data',
    parts: [
        {
            // These four fields are required for each part.
            // Optionally, you can also set the `contentType` value individually for each part.
            name: 'my-part-name',
            size: attachment.size,
            fileName: 'filename',
            content: attachment.content
        }
    ]
});
```

#### putSync

Executes a synchronous PUT request.

##### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `uri` | `string` | The request URI. The complete URL is a concatenation of the string that is passed to the URL parameter in the Connection constructor and this string. If the URL parameter in the Connection constructor is empty, specify the absolute URL of the target site. |
| `queryParams` | `Array.<{name: String, value: String}>`, `Object` | The query parameters. If an object is passed, its keys are considered to be parameter names. If the payload parameter is empty, the query parameters are passed as a form entity. |
| `payload` | `string` | The payload to be sent in the request. |

##### Returns

Return type: `Response`.

An object that represents an HTTP response.

## REQUEST_TYPES

A collection of supported HTTP request types. Note that instead of passing a proper
request type to the Connection.doSync method, there are dedicated methods that correspond to each
request type that you can call directly. For example, getSync or postSync.

Type: `object`  

### Contents

#### Properties
- [`CONNECT`](#connect)
- [`DELETE`](#delete)
- [`GET`](#get)
- [`HEAD`](#head)
- [`OPTIONS`](#options)
- [`PATCH`](#patch)
- [`POST`](#post)
- [`PUT`](#put)

### Properties

#### CONNECT

Establishes a tunnel to the server identified by the target resource.

Readonly  

Return type: `string`  

#### DELETE

Deletes the target resource.

Readonly  

Return type: `string`  

#### GET

Requests data from the target resource.

Readonly  

Return type: `string`  

#### HEAD

Same as GET, but the response only contains headers and no data.

Readonly  

Return type: `string`  

#### OPTIONS

Describes the communication options for the target resource.

Readonly  

Return type: `string`  

#### PATCH

Applies partial modifications to the target resource.

Readonly  

Return type: `string`  

#### POST

Submits data to the target resource.

Readonly  

Return type: `string`  

#### PUT

Replaces all current representations of the target resource.

Readonly  

Return type: `string`  

## Response

A class that creates a definition for an HTTP response.
If an exception occurs during processing, most of the properties in the response object are empty.

Type: `Object`  

### Contents

#### Properties
- `response`
- `responseAsStream`
- `headers`
- `code`
- `exception`
- `isSuccess`
- [`bodyAsStream`](#bodyasstream)
- [`body`](#body)

#### Methods
- [`json`](#json)

### Examples

```javascript
// Gets the content of a PasteBin paste, assuming that we have received its key (`pasteBinKey`) in a prior request.
const http = require('@jetbrains/youtrack-scripting-api/http');
const connection = new http.Connection('http://pastebin.com/raw/');
connection.addHeader({name: 'Content-Type', value: 'text/plain'});
const response = connection.getSync(pasteBinKey, '');
if (response && response.code === 200) {
  let text = '';
  response.headers.forEach(function(header) {
    text += header.name + ': ' + header.value + '\n';
  });
  text += '\n' + response.response;
  issue.addComment(text);
}
```

### Properties

| Name | Type | Description |
| --- | --- | --- |
| `response` | `string` | The response body. If an exception occurs during processing, the response body is empty (null). |
| `responseAsStream` | `Object` | A byte stream representation of the response body. If an exception occurs during processing, the property is empty (null). |
| `headers` | `Array.<{name: String, value: String}>` | A collection of response headers. If an exception occurs during processing, the collection is empty. |
| `code` | `number` | The HTTP status code that is assigned to the response. If an exception occurs during processing, the property is empty. |
| `exception` | `Object` | The exception that occurred during processing. |
| `isSuccess` | `boolean` | An indication of the success or failure for the request. If the HTTP status code is between 200 (inclusive) and 400 (exclusive), this property is set to 'true'. |

#### bodyAsStream

A byte stream representation of the response body.
Contains the same value as the `responseAsStream` property.
If an exception occurs while processing the request, the value is `null`.

Readonly  
Since: `2024.2`  

Return type: `Object`  

#### body

The response body.
Contains the same value as the `response` property.
If an exception occurs while processing the request, the value is `null`.

Readonly  
Since: `2024.2`  

Return type: `string`  

### Methods

#### json

Parses the response body as JSON. This is the recommended way to read a JSON response.
When the body is a string, it is equivalent to `JSON.parse(response.response)`.
When the body has already been parsed into an object, the method returns it unchanged.

Like `JSON.parse`, this method throws an exception when the body does not contain valid JSON.
Before parsing the body, check the `isSuccess` or `code` values.

Since: `2024.2`  

##### Returns

Return type: `Object`, `Array`.

The parsed response body.

##### Examples

```javascript
// Reads a JSON response from a third-party service.
// The API key is stored in the app settings as a secret, so it is passed to the `addHeader` method as is.
// Concatenating the API key with a string produces a string that contains a mask instead of the API key.
const http = require('@jetbrains/youtrack-scripting-api/http');
const connection = new http.Connection('https://api.example.com');
connection.addHeader('X-Api-Key', ctx.settings.apiKey);
const response = connection.getSync('customers/' + customerId);
if (response.isSuccess) {
  const customer = response.json();
  ctx.issue.addComment('Customer plan: ' + customer.plan);
} else {
  console.warn('Request failed: ' + response.code + ' ' + response.response);
}
```
