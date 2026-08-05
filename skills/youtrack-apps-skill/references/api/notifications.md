# notifications

This module contains functionality for sending email messages.
These messages are independent from the notification scheme that is used for subscriptions to issue updates in YouTrack.
All of the components for these email messages are defined in the parameters for the function that is supported in this module.
However, the messages are still sent by the SMTP server that is connected to your YouTrack installation.

## Functions

### sendEmail

Sends an email message to one or more email addresses.
If the project that the issue belongs to uses a dedicated project 'From' email, the email is sent from this address.
Otherwise, the default server 'From' address is taken.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `message` | `Object` | An object that contains all of the message components that are required for sendout. |
| `message.fromName` | `string` | The visible name of the sender. When used, the specified value is displayed as the sender name in the email message. If the sender email (whether taken from the project settings or the server setting) includes a sender name, it is overwritten with this value. If this parameter is left empty, the presentation of the sender is determined by the 'From' address that is saved in either the project or server settings. |
| `message.to` | `Array.<string>` | A list of recipient email addresses. |
| `message.cc` | `Array.<string>` | An optional list of email copy recipient addresses. |
| `message.bcc` | `Array.<string>` | An optional list of blind carbon copy recipient addresses. |
| `message.subject` | `string` | The email message subject. |
| `message.body` | `string` | The email message body. |
| `message.headers` | `Object` | An optional key-value map with custom email headers. Some headers, like 'Reply-To' may be overridden with project settings. |
| `issue` | `Issue` | The issue that the email message is related to. All email messages that are related to a single issue are combined into one thread. |

#### Examples

```javascript
const notifications = require('@jetbrains/youtrack-scripting-api/notifications');
const issue = ctx.issue;
if (issue.comments.added.isNotEmpty()) {
    const authorName = issue.comments.added.first().author.fullName;
    const text = `<div style="font-family: sans-serif">
        <div style="padding: 10px 10px; font-size: 13px; border-bottom: 1px solid #D4D5D6;">
          New comment was added in issue ${issue.id} by ${authorName}
        </div>
      </div>`;

    const message = {
        fromName: authorName,
        to: ['user1@jetbrains.com', 'user2@jetbrains.com'],
        cc: ['user1@jetbrains.com', 'user2@jetbrains.com'],
        bcc: ['user1@jetbrains.com', 'user2@jetbrains.com'],
        subject: `New comment in ${issue.id}`,
        headers: {
            'X-Custom-Header': 'Important value'
        },
        body: text
    };
    notifications.sendEmail(message, issue);
}
```
