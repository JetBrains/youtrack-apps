# Pocket Status user guide

Pocket Status adds a status tag to text in YouTrack. You can put the tag in an issue description, a comment, or an article. The tag can show one of two things:

- **A status from a status set.** You select the status. A click on the tag sets the next status of the set.
- **A field of an issue.** The tag shows the current value of the field, for example the State of `QA-12`. The tag changes when the field changes.

This guide is for users and administrators of Pocket Status.

## Contents

1. [Before you start](#before-you-start)
2. [Add a status tag](#add-a-status-tag)
3. [Change the status](#change-the-status)
4. [Status sets](#status-sets)
5. [Show a field of an issue](#show-a-field-of-an-issue)
6. [Who can do what](#who-can-do-what)
7. [Settings for administrators](#settings-for-administrators)
8. [Troubleshooting](#troubleshooting)
9. [Limits](#limits)

## Before you start

You need YouTrack 2026.2 or later.

An administrator must do these steps one time:

1. Install the Pocket Status app.
2. Attach the app to each project that uses project status sets.
3. Make sure that the app is enabled in these projects.

Personal status sets and issue fields also work in projects without the app.

## Add a status tag

1. Open an issue, a comment, or an article in edit mode.
2. Put the cursor where you want the tag.
3. Open the insert menu of the editor and select the **Pocket Status** widget.
4. The configuration dialog opens.
5. In **Status set**, select a set.
6. Under **Pick a status**, click the status that you want.

The tag shows in the text. The tag has no frame, so it reads as part of the text.

If you close the dialog before you select a status, the widget shows the **Set status** button. Click it to open the dialog again.

### Change the size of the tag

YouTrack does not change the size of the widget to fit its content. To make the widget larger or smaller, drag the edge of the widget in the editor.

A tag that shows a field of an issue needs more space. Make it approximately 300 px wide to show the issue summary.

## Change the status

**Tag with a status from a set:**

- Click the tag. The tag shows the next status of the set. After the last status, the tag shows the first status again.
- To use a different set, open the widget menu and select **Edit...**.

You can change the status only when you can edit the text that holds the tag.

**Tag that shows a field of an issue:**

1. Click the tag. A dialog shows all values of the field.
2. Click the value that you want.

The tag does not go to the next value automatically, because a workflow can allow only some changes. If YouTrack does not accept the change, the tag shows the old value again and a message tells you why.

## Status sets

A status set is a list of statuses. Each status has a name and two colors: background and text.

There are two types of status sets:

| Type | Who sees it | Who changes it | Where to manage it |
| --- | --- | --- | --- |
| **Project set** | All users of the project | Members of the project team, and project administrators | The **Pocket Status** tab of the project |
| **Personal set** | You, in all projects. Other users see it only in tags that use it. | Only you | The **Pocket Status** tab of your profile |

A project without its own sets shows two predefined sets: **Predefined** and **Proofreading**.

In the configuration dialog, **Status set** shows the sets in groups: **Project sets** and **My sets**.

### Create a status set in the widget dialog

1. Open the configuration dialog of the widget.
2. Click **+** (Create new set) next to **Status set**.
3. Type a name in **Set name**.
4. If you are a member of the project team, select where to save the set in **Save to**: **Project sets** or **My sets**. Other users always save to **My sets**.
5. Click **Add value**.
6. Type the name of the status.
7. To get different colors, click the preview tag.
8. Push **Enter** or click **Add**. The form stays open for the next status.
9. When you have added all statuses, click **Done**.
10. Click **Save**.

To remove a status before you save, click the cross on its tag.

### Edit a status set in the widget dialog

1. In **Status set**, select the set.
2. Click the pencil (Edit set) next to **Status set**.
3. Add or remove statuses.
4. Click **Save**. To discard your changes, click **Cancel**.

You see the pencil only for sets that you can change.

### Manage status sets in a tab

1. Open the **Pocket Status** tab of the project, or of your profile.
2. To add a set, click **Add set** and type its name.
3. To add a status, click **Add value** in the set.
4. To remove a status, click the cross on its tag.
5. To remove a set, click **Remove set**.
6. Click **Save**. To discard your changes, click **Discard changes**.

**Save** stays disabled until each set has a name, all names are different, and each set has a minimum of one status.

### Rules for status sets

- **A saved set keeps its name.** Tags find their set by its name. If you need a different name, make a new set.
- **A tag keeps its status when you remove that status from the set.** The next click on the tag sets the first status of the set.
- **New statuses show after you reload the page.** A tag that is open when you change a set keeps the old list until you reload the page.

## Show a field of an issue

A tag can show the value of a field of any issue. You can use these fields:

- State
- Single-value enum fields, for example Priority or Type
- Single-value owned fields, for example Subsystem

The tag shows the issue ID as a link, the issue summary, and the field value.

### Set up the tag

1. Open the configuration dialog of the widget.
2. Under **Or show a field of an issue**, type the issue ID, for example `QA-12`.
3. Push **Enter** or click **Find**.
4. In **Field**, select the field.
5. Click **Track**.

To show a status from a set again, open the dialog and select a status from a set.

### How the tag gets new values

The tag reads the issue again:

- every 30 seconds while the page is open and visible,
- when you go back to the browser tab,
- when you click **Refresh** in the widget header.

### What other users see

The tag reads the issue with the access rights of the user who looks at it.

- A user who can see the issue sees the ID, the summary, and the value.
- A user who cannot see the issue sees **Restricted issue** with a lock. This user does not see the ID, the summary, or the value.
- A user can click the value only when this user can change the field and can edit the text that holds the tag.

## Who can do what

| Action | Who can do it |
| --- | --- |
| See a tag with a status from a set | All users who can see the text |
| Change a status from a set | Users who can edit the text |
| Create or change a project set | Members of the project team, and project administrators |
| Create or change a personal set | The owner of the set |
| See a field of an issue | Users who can see the issue |
| Change a field of an issue | Users who can change that field and can edit the text. Workflows of the project also apply. |

## Settings for administrators

| Setting | Default | Where to set it | What it does |
| --- | --- | --- | --- |
| **Issue tracking** | On | In the app settings, for all projects or for one project | When it is off, the widget does not offer **Or show a field of an issue**. Tags that already show a field show **Issue tracking is turned off** and do not read the issue. |

A project value overrides the global value.

## Troubleshooting

| Problem | Cause | What to do |
| --- | --- | --- |
| **Status set** shows only **My sets** | The app is not attached to the project | Ask an administrator to attach the app to the project |
| You do not see **+** for a project set in **Save to** | You are not a member of the project team | Save the set to **My sets**, or ask a team member |
| A click on the tag does nothing | You cannot edit the text, or you cannot change the field | Ask for access to the text or to the issue |
| The tag shows **Restricted issue** | You cannot see the tracked issue | Ask for access to the issue |
| The tag shows **Issue tracking is turned off** | An administrator turned off the **Issue tracking** setting | Ask an administrator |
| "No issue with this ID, or you cannot see it" | The issue ID is wrong, or you cannot see the issue | Check the ID, or ask for access to the issue |
| "This issue has no field with colored values to track" | The issue has no State, enum, or owned field | Select a different issue |
| A new status does not show in the tag | The tag loads the sets once when the page opens | Reload the page |
| The issue summary is cut | The widget is too narrow | Make the widget wider in the editor |

## Limits

- YouTrack does not change the size of a widget in text to fit its content. Change the size in the editor.
- The tag gets new values of an issue field every 30 seconds, not immediately.
- The tag shows the values of a field that are not archived.
