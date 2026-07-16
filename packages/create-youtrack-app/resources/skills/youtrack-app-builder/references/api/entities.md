# entities

Contains definitions for the entities in YouTrack that are accessible to workflows.

## Types
- [Requirements](#types-requirements)
- [Abstract Entities](#types-abstract-entities)
- [Entities](#types-entities)
- [Additional Entities](#types-additional-entities)

<a id="types-requirements"></a>
## Requirements
- [`Requirement`](#type-requirement)
- [`Requirements`](#type-requirements)

<a id="type-requirement"></a>
### Requirement

A single element in a set of Requirements

Type: `Object`  

#### Contents

##### Properties
- `name`
- `login`
- `id`
- `multi`
- `outward`
- `inward`
- `type`

#### Properties

| Name | Type | Description |
| --- | --- | --- |
| `name (optional)` | `string` | The optional name of the field or entity. If not provided,  the key (alias) for this requirement in the Requirements object is used. |
| `login (optional)` | `string` | An optional login, used instead of name for User requirements. |
| `id (optional)` | `string` | An optional issue ID, used instead of name for Issue requirements. |
| `multi (optional)` | `boolean` | An optional flag, `false` by default. If `true`, a required field  must store multiple values (if applicable). |
| `outward (optional)` | `string` | The outward name of the issue link type (required for IssueLinkPrototype requirements). |
| `inward (optional)` | `string` | The inward name of the issue link type (equals outward name if not set). |
| `type (optional)` | `string`, `Object` | The data type of the entity. Can be one of the following custom field types: Build.fieldType,  OwnedField.fieldType, State.fieldType, EnumField.fieldType,  ProjectVersion.fieldType, User.fieldType, UserGroup.fieldType,  Field.dateType, Field.floatType, Field.integerType,  Field.stringType, Field.periodType.  Can also be one of the following system-wide entities: User, UserGroup,  Project, Issue, Tag, SavedQuery, IssueLinkPrototype. |

<a id="type-requirements"></a>
### Requirements

The `Requirements` object serves two purposes.
 First, it functions as a safety net. It specifies the set of entities that must exist for a rule to work as expected.
 Whenever one or more rule requirements are not met, corresponding errors are shown in the workflow administration UI.
 The rule is not executed until all of the problems are fixed.

 Second, it functions as a reference.
 Each entity in the requirements is plugged into the `context` object, so you can reference entities from inside your
 context-dependent functions (like an `action` function).

 There are two types of requirements: project-wide and system-wide.
 Project-wide requirements contain a list of custom fields that must be attached
 to each project that uses the rule as well as the required values from the sets of values for each custom field.
 System-wide requirements contain a list of other entities that must be available in YouTrack.
 This includes users, groups, projects, issues, tags, saved searches, and issue link types.

Type: `Object.<string, Requirement>`  

#### Examples

```javascript
requirements: {
   P: {
     type: entities.EnumField.fieldType,
     name: 'Priority',
     M: { name: 'Major' },
     Normal: {}
   },

   ImportantPerson: {
     type: entities.User,
     login: 'superadmin'
   },
   OurTeam: {
     type: entities.UserGroup,
     name: 'integration-team'
   },
   Int: {
     type: entities.Project,
     name: 'Integration'
   },
   Ref: {
     type: entities.Issue,
     id: 'INT-483'
   },
   ToBeReleased: {
     type: entities.Tag,
     name: 'To be released'
   },
   Untested: {
     type: entities.SavedQuery,
     name: 'Not tested yet'
   },
   Depend: {
     type: entities.IssueLinkPrototype,
     outward: 'is required for',
     inward: 'depends on'
   }
 }
```

<a id="types-abstract-entities"></a>
## Abstract Entities
- [`BaseArticle`](#type-basearticle)
- [`BaseArticleAttachment`](#type-basearticleattachment)
- [`BaseArticleComment`](#type-basearticlecomment)
- [`BaseComment`](#type-basecomment)
- [`BaseEntity`](#type-baseentity)
- [`BaseWorkItem`](#type-baseworkitem)

<a id="type-basearticle"></a>
### BaseArticle

The base class for article.

Since: `2021.4.23500`  

#### Contents

##### Properties
- [`attachments`](#attachments)
- [`author`](#author)
- [`content`](#content)
- [`isStarred`](#isstarred)
- [`originalArticle`](#originalarticle)
- [`summary`](#summary)
- [`tags`](#tags)

##### Methods
- [`addTag`](#addtag)
- [`hasTag`](#hastag)
- [`removeTag`](#removetag)

#### Properties

##### attachments

The set of attachments that are attached to the article.

Readonly  

Return type: `Set.<BaseArticleAttachment>`  

##### author

The user who created the article.

Readonly  

Return type: `User`  

##### content

The text that is entered as the article content.

Return type: `String`  

##### isStarred

If the current user has added the 'Star' to watch the article, this property is `true`.

Readonly  
Since: `2023.1`  

Return type: `Boolean`  

##### originalArticle

The article from which the current article draft was created, or `null` if the current article is not a draft.

Readonly  
Since: `2026.1`  

Return type: `Article`  

##### summary

The article title.

Return type: `String`  

##### tags

The list of tags that are attached to the article.

Since: `2023.1`  

Return type: `Set.<Tag>`  

#### Methods

##### addTag

Adds a tag with the specified name to an article. YouTrack adds the first matching tag that is visible to the current user.
If a match is not found, a new private tag is created for the current user.

Since: `2023.1`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to add to the article. |

###### Returns

Return type: `Tag`.

The tag that has been added to the article.

###### Examples

```javascript
article.addTag('review');
```

##### hasTag

Checks whether the specified tag is attached to the article.

Since: `2023.1`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `tagName` | `String` | The name of the tag to check for the article. |

###### Returns

Return type: `Boolean`.

If the specified tag is attached to the article, returns `true`.

##### removeTag

Removes a tag with the specified name from an article. If the specified tag is not attached to the article, nothing happens.
This method first searches through tags owned by the current user, then through all other visible tags.

Since: `2023.1`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to remove from the article. |

###### Returns

Return type: `Tag`.

The tag that has been removed from the article.

###### Examples

```javascript
article.removeTag('waiting for review');
```

<a id="type-basearticleattachment"></a>
### BaseArticleAttachment

The base class for article comment.

#### Contents

##### Properties
- [`author`](#author)
- [`fileUrl`](#fileurl)
- [`isRemoved`](#isremoved)
- [`metaData`](#metadata)

#### Properties

##### author

The user who attached the file to the issue.

Readonly  
Since: `2026.1`  

Return type: `User`  

##### fileUrl

The URL of the article attachment.

Readonly  
Since: `2026.1`  

Return type: `String`  

##### isRemoved

If the attachment is removed, this property is `true`.

Readonly  
Since: `2026.1`  

Return type: `Boolean`  

##### metaData

The image dimensions. For image files, the value is rw=_width_&rh=_height_. For non-image files, the value is `empty`.

Readonly  
Since: `2026.1`  

Return type: `String`  

<a id="type-basearticlecomment"></a>
### BaseArticleComment

The base class for article comment.

Since: `2021.4.23500`  

#### Contents

##### Properties
- [`attachments`](#attachments)
- [`created`](#created)
- [`isPinned`](#ispinned)
- [`text`](#text)
- [`updated`](#updated)

#### Properties

##### attachments

The set of attachments that are attached to the comment.

Readonly  

Return type: `Set.<BaseArticleAttachment>`  

##### created

Time the comment was created.

Readonly  

Return type: `Number`  

##### isPinned

When `true`, the comment is pinned in the article. Otherwise, `false`.

Since: `2024.1`  

Return type: `Boolean`  

##### text

The text of the comment.

Return type: `String`  

##### updated

Time the comment was last updated.

Readonly  

Return type: `Number`  

<a id="type-basecomment"></a>
### BaseComment

The base class for issue comment.

#### Contents

##### Properties
- [`attachments`](#attachments)
- [`created`](#created)
- [`isPinned`](#ispinned)
- [`text`](#text)
- [`updated`](#updated)

#### Properties

##### attachments

The set of attachments that are attached to the comment.

Readonly  
Since: `2018.1.40030`  

Return type: `Set.<IssueAttachment>`  

##### created

Time the comment was created.

Readonly  

Return type: `Number`  

##### isPinned

When `true`, the comment is pinned in the issue. Otherwise, `false`.

Since: `2024.1`  

Return type: `Boolean`  

##### text

The text of the comment.

Return type: `String`  

##### updated

Time the comment was last updated.

Readonly  

Return type: `Number`  

<a id="type-baseentity"></a>
### BaseEntity

The common ancestor for all entity types.

#### Contents

##### Properties
- [`becomesRemoved`](#becomesremoved)
- [`extensionProperties`](#extensionproperties)
- [`isNew`](#isnew)

##### Methods
- [`becomes`](#becomes)
- [`canBeReadBy`](#canbereadby)
- [`canBeWrittenBy`](#canbewrittenby)
- [`isChanged`](#ischanged)
- [`is`](#is)
- [`oldValue`](#oldvalue)
- [`required`](#required)
- [`was`](#was)

#### Properties

##### becomesRemoved

When `true`, the entity is removed in the current transaction. Otherwise, `false`.
This property can become `true` only in on-change rules when the rule is triggered on the removal of an issue or an article.
In the rule code, the `runOn` rule property must contain the `removal` parameter set to `true`.

Readonly  
Since: `2017.4.37915`  

Return type: `Boolean`  

###### Examples

```javascript
runOn: {removal: true}
```

##### extensionProperties

The object containing extension properties for this entity and their values.
Extension properties are custom properties that might be added to core YouTrack entities by an app.
For details about extension properties, see https://www.jetbrains.com/help/youtrack/devportal/apps-extension-properties.html.

Since: `2024.3`  

Return type: `Object`  

###### Examples

```javascript
const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.rule = entities.Issue.action({
    command: 'test',
    action: function (ctx) {
        const printValues = () => {
            return 'stringProp:' + ctx.issue.extensionProperties.stringProp + ';'
                + 'integerProp:' + ctx.issue.extensionProperties.integerProp + ';'
                + 'booleanProp:' + ctx.issue.extensionProperties.booleanProp + ';'
                + 'issueProp:' + ctx.issue.extensionProperties.issueProp?.id + ';'
                + 'issuesProp:' + ctx.issue.extensionProperties.issuesProp?.first()?.id + ';'
        }
        ctx.issue.addComment(printValues());
    }
});
```

##### isNew

When `true`, the entity is created in the current transaction. Otherwise, `false`.

Readonly  
Since: `2018.2.42351`  

Return type: `Boolean`  

#### Methods

##### becomes

Checks whether a field is set to an expected value in the current transaction.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field to check. |
| `expected` | `string` | The expected value. |

###### Returns

Return type: `boolean`.

If the field is set to the expected value, returns `true`.

##### canBeReadBy

Checks whether a user has permission to read the field.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field. |
| `user` | `User` | The user for whom the permission to read the field is checked. |

###### Returns

Return type: `boolean`.

If the user can read the field, returns `true`.

##### canBeWrittenBy

Checks whether a user has permission to update the field.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field. |
| `user` | `User` | The user for whom the permission to update the field is checked. |

###### Returns

Return type: `boolean`.

If the user can update the field, returns `true`.

##### isChanged

Checks whether the value of a field is changed in the current transaction.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field to check. |

###### Returns

Return type: `boolean`.

If the value of the field is changed in the current transaction, returns `true`.

##### is

Checks whether a field is equal to an expected value.

Since: `2019.2.55603`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field to check. |
| `expected` | `string` | The expected value. |

###### Returns

Return type: `boolean`.

If the field is equal to the expected value, returns `true`.

##### oldValue

Returns the previous value of a single-value field before an update was applied. If the field is not changed
in the transaction, returns null.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field. |

###### Returns

Return type: `Object`.

If the field is changed in the current transaction, the previous value of the field.
Otherwise, null.

##### required

Asserts that a value is set for a field.
If a value for the required field is not set, the specified message is displayed in the user interface.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field to check. |
| `message` | `string` | The message that is displayed to the user that describes the field requirement. |

##### was

Checks whether a field was equal to an expected value prior to the current transaction.

Since: `2019.2.55603`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field to check. |
| `expected` | `string` | The expected value. |

###### Returns

Return type: `boolean`.

If the field was equal to the expected value, returns `true`.

<a id="type-baseworkitem"></a>
### BaseWorkItem

The base class for issue work items.

#### Contents

##### Properties
- [`author`](#author)
- [`created`](#created)
- [`creator`](#creator)
- [`description`](#description)
- [`type`](#type)
- [`updated`](#updated)

#### Properties

##### author

The user to whom the work is attributed in the work item.

Readonly  

Return type: `User`  

##### created

The date when the work item was created.

Readonly  

Return type: `Number`  

##### creator

The user who added the work item to the issue.

Readonly  

Return type: `User`  

##### description

The work item description.

Return type: `String`  

##### type

The work item type.
 Writable since 2020.2

Return type: `WorkItemType`  

##### updated

The date when the work item was last updated.

Readonly  

Return type: `Number`  

<a id="types-entities"></a>
## Entities
- [`AbstractVcsItem`](#type-abstractvcsitem)
- [`Agile`](#type-agile)
- [`AppGlobalStorage`](#type-appglobalstorage)
- [`Article`](#type-article)
- [`ArticleAttachment`](#type-articleattachment)
- [`ArticleComment`](#type-articlecomment)
- [`Build`](#type-build)
- [`BundleElementCondition`](#type-bundleelementcondition)
- [`BundleProjectCustomField`](#type-bundleprojectcustomfield)
- [`Calendar`](#type-calendar)
- [`Calendar24x7`](#type-calendar24x7)
- [`ChangesProcessor`](#type-changesprocessor)
- [`Channel`](#type-channel)
- [`EnumField`](#type-enumfield)
- [`FeedbackForm`](#type-feedbackform)
- [`Field`](#type-field)
- [`FieldBasedBundleValuesCondition`](#type-fieldbasedbundlevaluescondition)
- [`FieldBasedUserValuesCondition`](#type-fieldbaseduservaluescondition)
- [`FieldBasedValuesCondition`](#type-fieldbasedvaluescondition)
- [`Gantt`](#type-gantt)
- [`GroupProjectCustomField`](#type-groupprojectcustomfield)
- [`Issue`](#type-issue)
- [`IssueAttachment`](#type-issueattachment)
- [`IssueComment`](#type-issuecomment)
- [`IssueLinkPrototype`](#type-issuelinkprototype)
- [`IssueTag`](#type-issuetag)
- [`IssueWorkItem`](#type-issueworkitem)
- [`MailboxChannel`](#type-mailboxchannel)
- [`OwnedField`](#type-ownedfield)
- [`PeriodProjectCustomField`](#type-periodprojectcustomfield)
- [`PersistentFile`](#type-persistentfile)
- [`Project`](#type-project)
- [`ProjectCustomField`](#type-projectcustomfield)
- [`ProjectTeam`](#type-projectteam)
- [`ProjectType`](#type-projecttype)
- [`ProjectVersion`](#type-projectversion)
- [`PullRequest`](#type-pullrequest)
- [`PullRequestState`](#type-pullrequeststate)
- [`SavedQuery`](#type-savedquery)
- [`SimpleCalendar`](#type-simplecalendar)
- [`SimpleProjectCustomField`](#type-simpleprojectcustomfield)
- [`Sprint`](#type-sprint)
- [`State`](#type-state)
- [`Tag`](#type-tag)
- [`TextProjectCustomField`](#type-textprojectcustomfield)
- [`User`](#type-user)
- [`UserCondition`](#type-usercondition)
- [`UserGroup`](#type-usergroup)
- [`UserProjectCustomField`](#type-userprojectcustomfield)
- [`UserType`](#type-usertype)
- [`VcsChange`](#type-vcschange)
- [`VcsServer`](#type-vcsserver)
- [`WatchFolder`](#type-watchfolder)
- [`WorkItemAttributeValue`](#type-workitemattributevalue)
- [`WorkItemProjectAttribute`](#type-workitemprojectattribute)
- [`WorkItemType`](#type-workitemtype)

<a id="type-abstractvcsitem"></a>
### AbstractVcsItem

Represents VCS-related items such as commits and pull requests.

#### Contents

##### Properties
- [`branch`](#branch)
- [`text`](#text)
- [`user`](#user)
- [`userName`](#username)

#### Properties

##### branch

The name of the branch that the VCS change was committed to.

Readonly  
Since: `2018.1.38923`  

Return type: `String`  

##### text

The commit message or pull request description that was provided when the change was applied to the VCS.

Readonly  
Since: `2018.1.38923`  

Return type: `String`  

##### user

The user who authored the VCS change.

Readonly  
Since: `2018.1.38923`  

Return type: `User`  

##### userName

The name of the change author, as returned by the VCS.

Readonly  
Since: `2018.1.38923`  

Return type: `String`  

<a id="type-agile"></a>
### Agile

Represents an agile board and the set of sprints that belong to the board.

#### Contents

##### Properties
- [`author`](#author)
- [`currentSprint`](#currentsprint)
- [`name`](#name)
- [`sprints`](#sprints)

##### Methods
- [`addIssue`](#addissue)
- [`containsIssue`](#containsissue)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findByName`](#findbyname)
- [`findSprintByName`](#findsprintbyname)
- [`getAddedSprints`](#getaddedsprints)
- [`getIssueSprints`](#getissuesprints)
- [`getRemovedSprints`](#getremovedsprints)
- [`getSprints`](#getsprints)
- [`isAdded`](#isadded)
- [`isRemoved`](#isremoved)
- [`removeIssue`](#removeissue)

#### Properties

##### author

The user who created the board.

Readonly  

Return type: `User`  

##### currentSprint

The sprint that is considered to be in active development at the current moment.

Readonly  
Since: `2023.1`  

Return type: `Sprint`  

##### name

The name of the agile board.

Readonly  

Return type: `String`  

##### sprints

The set of sprints that are associated with the board.

Readonly  

Return type: `Set.<Sprint>`  

#### Methods

##### addIssue

Adds the issue to the current sprint of the board.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue that is added to the board. |

##### containsIssue

Checks whether the issue belongs to the board.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition is checked. |

###### Returns

Return type: `Boolean`.

If the issue belongs to the board, returns ``true``.

##### findByExtensionProperties

Searches for Agile entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<Agile>`.

The set of Agile entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findByName

Returns a set of agile boards that have the specified name.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of an agile board. |

###### Returns

Return type: `Set.<Agile>`.

A set of agile boards that are assigned the specified name.

##### findSprintByName

Finds a specific sprint by name.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the sprint. |

###### Returns

Return type: `Sprint`.

If a sprint with the specified name is found, the corresponding Sprint object is returned. Otherwise, the return value is null.

##### getAddedSprints

Gets all sprints of this board where the issue is added during the current transaction.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which added sprints are returned. |

###### Returns

Return type: `Set.<Sprint>`.

A set of sprints where the issue is added.

##### getIssueSprints

Returns the sprints that an issue is assigned to on an agile board.

Since: `2018.1.39547`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which you want to get the sprints that it is assigned to. |

###### Returns

Return type: `Set.<Sprint>`.

The sprints that the issue is assigned to on the agile board.

##### getRemovedSprints

Gets all sprints of this board from which the issue is removed during the current transaction.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which removed sprints are returned. |

###### Returns

Return type: `Set.<Sprint>`.

A set of sprints from which the issue is removed.

##### getSprints

Gets all sprints of this board where the issue belongs.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which sprints are returned. |

###### Returns

Return type: `Set.<Sprint>`.

A set of sprints where the issue belongs.

##### isAdded

Checks whether the issue gets added to the board in the current transaction.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition is checked. |

###### Returns

Return type: `Boolean`.

If the issue gets added to the board, returns ``true``.

##### isRemoved

Checks whether the issue gets removed from the board in the current transaction.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition is checked. |

###### Returns

Return type: `Boolean`.

If the issue gets removed from the board, returns ``true``.

##### removeIssue

Removes the issue from all sprints of this board where it belongs.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue that is removed from the board. |

<a id="type-appglobalstorage"></a>
### AppGlobalStorage

Entity type for App global extension properties

Since: `2024.2`  

<a id="type-article"></a>
### Article

Represents an article in YouTrack.

Since: `2021.4.23500`  

#### Contents

##### Constructors
- [`Article`](#new-article)

##### Properties
- [`attachments`](#attachments)
- [`author`](#author)
- [`childArticles`](#childarticles)
- [`comments`](#comments)
- [`content`](#content)
- [`created`](#created)
- [`editedComments`](#editedcomments)
- [`id`](#id)
- [`isStarred`](#isstarred)
- [`numberInProject`](#numberinproject)
- [`originalArticle`](#originalarticle)
- [`parentArticle`](#parentarticle)
- [`permittedGroups`](#permittedgroups)
- [`permittedUsers`](#permittedusers)
- [`pinnedComments`](#pinnedcomments)
- [`project`](#project)
- [`summary`](#summary)
- [`tags`](#tags)
- [`updated`](#updated)
- [`updatedBy`](#updatedby)
- [`url`](#url)

##### Methods
- [`addAttachment`](#addattachment)
- [`addComment`](#addcomment)
- [`createDraft`](#createdraft)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findById`](#findbyid)

#### Constructors

##### new Article

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `author` | `User`, `JsonForArticleConstructor` | The author of the article. Alternatively, pass a JSON specified by JsonForArticleConstructor |
| `project (optional)` | `Project` | The project where the new article is created. |
| `summary (optional)` | `String` | The article title. |

#### Properties

##### attachments

The set of attachments that are attached to the article.

Readonly  

Return type: `Set.<BaseArticleAttachment>`  

##### author

The user who created the article.

Readonly  

Return type: `User`  

##### childArticles

The set of sub-articles of the current one.

Since: `2024.4`  

Return type: `Set.<Article>`  

##### comments

A list of comments for the article.

Readonly  

Return type: `Set.<ArticleComment>`  

##### content

The text that is entered as the article content.

Return type: `String`  

##### created

The date when the article was created.

Readonly  

Return type: `Number`  

##### editedComments

The set of comments that are edited in the current transaction.
Comments that are added and removed are not considered to be edited.
Instead, these are represented by the `article.comments.added` and `article.comments.removed` properties.

Readonly  

Return type: `Set.<ArticleComment>`  

##### id

The article ID.

Readonly  

Return type: `String`  

##### isStarred

If the current user has added the 'Star' to watch the article, this property is `true`.

Readonly  
Since: `2023.1`  

Return type: `Boolean`  

##### numberInProject

The article number in the project.

Readonly  

Return type: `Number`  

##### originalArticle

The article from which the current article draft was created, or `null` if the current article is not a draft.

Readonly  
Since: `2026.1`  

Return type: `Article`  

##### parentArticle

The parent article of the current one.

Since: `2024.4`  

Return type: `Article`  

##### permittedGroups

The groups for which the article is visible when the visibility is restricted to multiple groups.

Since: `2026.1`  

Return type: `Set.<UserGroup>`  

##### permittedUsers

The list of users for whom the article is visible.

Since: `2026.1`  

Return type: `Set.<User>`  

##### pinnedComments

The set of comments that are pinned in the article.

Readonly  
Since: `2024.1`  

Return type: `Set.<ArticleComment>`  

##### project

The project to which the article is assigned.

Return type: `Project`  

##### summary

The article title.

Return type: `String`  

##### tags

The list of tags that are attached to the article.

Since: `2023.1`  

Return type: `Set.<Tag>`  

##### updated

The date when the article was last updated.

Readonly  

Return type: `Number`  

##### updatedBy

The user who last updated the article.

Readonly  

Return type: `User`  

##### url

The absolute URL that points to the article.

Readonly  
Since: `2025.1`  

Return type: `String`  

#### Methods

##### addAttachment

Attaches a file to the article.
Makes `article.attachments.isChanged` return `true` for the current transaction.

Since: `2020.2`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `content` | `InputStream`, `String`, `JsonForArticleAddAttachment` | The content of the file in binary or base64 form. Alternatively, pass a JSON specified by JsonForArticleAddAttachment |
| `name (optional)` | `String` | The name of the file. |
| `charset (optional)` | `String` | The charset of the file. Only applicable to text files. |
| `mimeType (optional)` | `String` | The MIME type of the file. |

###### Returns

Return type: `ArticleAttachment`.

The attachment that is added to the article.

##### addComment

Adds a comment to the article.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `text` | `String`, `JsonForArticleAddComment` | The text to add to the article as a comment. Alternatively, pass a JSON specified by JsonForArticleAddComment |
| `author (optional)` | `User` | The author of the comment. |

###### Returns

Return type: `ArticleComment`.

A newly created comment.

##### createDraft

Creates a new article draft.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `project (optional)` | `Project` | The project where the new article draft is created. |
| `author (optional)` | `User` | The author of the article draft. |

###### Returns

Return type: `ArticleDraft`.

The newly created article draft.

##### findByExtensionProperties

Searches for Article entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<Article>`.

The set of Article entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findById

Finds an article by its visible ID.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `id` | `String` | The article ID. |

###### Returns

Return type: `Article`.

The article that is assigned the specified ID.

<a id="type-articleattachment"></a>
### ArticleAttachment

Represents a file that is attached to an article.

#### Contents

##### Properties
- [`created`](#created)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### created

The date and time when the attachment was created as a timestamp.

Readonly  
Since: `2026.1`  

Return type: `Number`  

#### Methods

##### findByExtensionProperties

Searches for ArticleAttachment entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<ArticleAttachment>`.

The set of ArticleAttachment entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-articlecomment"></a>
### ArticleComment

Represents a comment that is added to an article.

Since: `2021.4.23500`  

#### Contents

##### Properties
- [`article`](#article)
- [`author`](#author)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### article

The article the comment belongs to.

Readonly  

Return type: `Article`  

##### author

The user who created the comment.

Readonly  

Return type: `User`  

#### Methods

##### findByExtensionProperties

Searches for ArticleComment entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<ArticleComment>`.

The set of ArticleComment entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-build"></a>
### Build

Represents a value that is stored in a custom field that stores a build type.

#### Contents

##### Properties
- [`assembleDate`](#assembledate)
- [`fieldType`](#fieldtype)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### assembleDate

The date and time when the build was assembled.

Readonly  

Return type: `Number`  

##### fieldType

Field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

#### Methods

##### findByExtensionProperties

Searches for Build entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<Build>`.

The set of Build entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-bundleelementcondition"></a>
### BundleElementCondition

Represents a value-based condition for a custom field in a specific project.

Since: `2025.3`  

#### Contents

##### Properties
- [`bundleElement`](#bundleelement)
- [`possibleValues`](#possiblevalues)

#### Properties

##### bundleElement

The value of the field that is used to determine the set of `possibleValues` in the conditional field.

Readonly  

Return type: `Field`  

##### possibleValues

The set of possible values for the conditional field.

Readonly  

Return type: `Set.<Field>`  

<a id="type-bundleprojectcustomfield"></a>
### BundleProjectCustomField

Represents a custom field in a project that stores a predefined set of values.

#### Contents

##### Properties
- [`defaultValues`](#defaultvalues)
- [`values`](#values)
- [`valuesCondition`](#valuescondition)

##### Methods
- [`createValue`](#createvalue)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findValueByName`](#findvaluebyname)
- [`findValueByOrdinal`](#findvaluebyordinal)
- [`getPossibleValuesForIssue`](#getpossiblevaluesforissue)
- [`isValuePermittedInIssue`](#isvaluepermittedinissue)

#### Properties

##### defaultValues

The values that are used as the default for this field.

Readonly  
Since: `2020.5`  

Return type: `Set.<Field>`  

##### values

The list of available values for the custom field.

Readonly  

Return type: `Set.<Field>`  

##### valuesCondition

The condition that determines which values are possible for this field based on the condition field value. If not setthere are no value-based conditions for this field, all values are possible.

Readonly  
Since: `2025.3`  

Return type: `FieldBasedBundleValuesCondition`  

#### Methods

##### createValue

Adds a value to the set of values for the custom field. If a value with the specified name already exists in the set, an exception is thrown.

Since: `2018.2.45017`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the value that you want to add to the set. |

###### Returns

Return type: `Field`.

The value that was added to the set.

##### findByExtensionProperties

Searches for BundleProjectCustomField entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<BundleProjectCustomField>`.

The set of BundleProjectCustomField entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findValueByName

Returns a value with the specified name in the set of values for a custom field.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the field value to search for. |

###### Returns

Return type: `Field`.

The value with the specified name in the set of values for the custom field.

##### findValueByOrdinal

Returns a value that is assigned a specified position in the set of values for a custom field.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `ordinal` | `Number` | The position of the field value to search by. |

###### Returns

Return type: `Field`.

The value that is assigned the specified position in the set of values for the custom field.

##### getPossibleValuesForIssue

The list of possible values for a custom field based on the value-based conditions in the project settings and the current value stored in the issue. If there are no value-based conditions in the project settings, returns the complete list of values for the custom field.

Since: `2025.3`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the value is checked. |

###### Returns

Return type: `Set.<Field>`.

The set of possible values for the custom field.

##### isValuePermittedInIssue

Checks if a specified value is allowed in the issue.

Since: `2025.2`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the value is checked. |
| `value` | `Field` | The value to check. |

###### Returns

Return type: `Boolean`.

If the conditions for using the specified value in the issue have been met, returns `true`.

<a id="type-calendar"></a>
### Calendar

Represents a group of business hours settings in a helpdesk project. In the Workflow API, such a group is called a Calendar.

<a id="type-calendar24x7"></a>
### Calendar24x7

Represents a group of 24x7 business hours settings in a helpdesk project. In the Workflow API, such a group is called a Calendar24x7.

#### Contents

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`instance`](#instance)

#### Methods

##### findByExtensionProperties

Searches for Calendar24x7 entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<Calendar24x7>`.

The set of Calendar24x7 entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### instance

Returns an instance of a Calendar24x7 entity.

###### Returns

Return type: `Calendar24x7`.

Returns an instance of a Calendar24x7 entity.

<a id="type-changesprocessor"></a>
### ChangesProcessor

An entity that retrieves VCS changes and creates their representation in YouTrack.

Since: `2018.1.38923`  

#### Contents

##### Properties
- [`pullRequests`](#pullrequests)
- [`server`](#server)
- [`url`](#url)
- [`vcsChanges`](#vcschanges)

#### Properties

##### pullRequests

The list of pull requests that are associated with the changes processor.

Readonly  
Since: `2020.3`  

Return type: `Set.<PullRequest>`  

##### server

The VCS server that the processor connects to.

Readonly  
Since: `2018.1.38923`  

Return type: `VcsServer`  

##### url

The URL of the change processor. Integrations with TeamCity, Jenkins, and GitLab CI/CD return the web address of the build configuration or project page.

Readonly  
Since: `2021.2`  

Return type: `String`  

##### vcsChanges

The list of commits that are associated with the changes processor.

Readonly  
Since: `2020.3`  

Return type: `Set.<VcsChange>`  

<a id="type-channel"></a>
### Channel

Represents a channel used by customers to reach out to the helpdesk for support.

#### Contents

##### Properties
- [`name`](#name)

#### Properties

##### name

The name assigned to a channel in a helpdesk project

Readonly  

Return type: `String`  

<a id="type-enumfield"></a>
### EnumField

Represents a value in a custom field that stores a predefined set of values.

#### Contents

##### Properties
- [`fieldType`](#fieldtype)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### fieldType

Field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

#### Methods

##### findByExtensionProperties

Searches for EnumField entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<EnumField>`.

The set of EnumField entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-feedbackform"></a>
### FeedbackForm

Represents an online form used in a helpdesk project. Online forms provide customers with a web-based interface that they can use to submit inquiries, requests, or complaints.

#### Contents

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Methods

##### findByExtensionProperties

Searches for FeedbackForm entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<FeedbackForm>`.

The set of FeedbackForm entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-field"></a>
### Field

Represents a value that is stored in a custom field.
The custom fields themselves are represented by the Fields class.

#### Contents

##### Properties
- [`backgroundColor`](#backgroundcolor)
- [`colorIndex`](#colorindex)
- [`dateTimeType`](#datetimetype)
- [`dateType`](#datetype)
- [`description`](#description)
- [`floatType`](#floattype)
- [`foregroundColor`](#foregroundcolor)
- [`integerType`](#integertype)
- [`isArchived`](#isarchived)
- [`name`](#name)
- [`ordinal`](#ordinal)
- [`periodType`](#periodtype)
- [`presentation`](#presentation)
- [`stringType`](#stringtype)
- [`textType`](#texttype)

#### Properties

##### backgroundColor

The background color of the value in the custom field as it is displayed in YouTrack.

Readonly  

Return type: `String`  

##### colorIndex

The index value of the color that is assigned to the value in the custom field.

Readonly  

Return type: `Number`  

##### dateTimeType

Date and time field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

##### dateType

Date field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

##### description

The description of the value as visible in the administrative UI for custom fields.

Readonly  

Return type: `String`  

##### floatType

Float field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

##### foregroundColor

The foreground color of the value in the custom field as it is displayed in YouTrack.

Readonly  

Return type: `String`  

##### integerType

Integer field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

##### isArchived

If the value is archived, this property is `true`.

Readonly  

Return type: `Boolean`  

##### name

The name of the value, which is also stored as the value in the custom field.

Readonly  

Return type: `String`  

##### ordinal

The position of the value in the set of values for the custom field.

Readonly  

Return type: `Number`  

##### periodType

Period field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

##### presentation

String representation of the value.

Readonly  

Return type: `String`  

##### stringType

String field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

##### textType

Text field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

<a id="type-fieldbasedbundlevaluescondition"></a>
### FieldBasedBundleValuesCondition

Represents a value-based condition for a custom field in a specific project.

Since: `2025.3`  

#### Contents

##### Properties
- [`conditions`](#conditions)

#### Properties

##### conditions

The set of value-based conditions for the custom field. Each condition is represented by the value from the field that defines the condition (the `bundleElement`) and a set of possible values for the conditional field (the `possibleValues`).

Readonly  
Since: `2025.3`  

Return type: `Set.<BundleElementCondition>`  

<a id="type-fieldbaseduservaluescondition"></a>
### FieldBasedUserValuesCondition

Represents a value-based condition for a custom field that stores references to users.

Since: `2025.3`  

#### Contents

##### Properties
- [`conditions`](#conditions)

#### Properties

##### conditions

The set of value-based conditions for the custom field. Each condition is represented by the value from the field that defines the condition (the `bundleElement`) and a set of possible values for the conditional field (the `possibleValues`).

Readonly  
Since: `2025.3`  

Return type: `Set.<UserCondition>`  

<a id="type-fieldbasedvaluescondition"></a>
### FieldBasedValuesCondition

Represents the base entity for a value-based condition for a custom field in a project.

Since: `2025.3`  

#### Contents

##### Properties
- [`field`](#field)

#### Properties

##### field

The custom field that this condition is based on.

Readonly  
Since: `2025.3`  

Return type: `BundleProjectCustomField`  

<a id="type-gantt"></a>
### Gantt

Represents a Gantt chart.

Since: `2022.1`  

#### Contents

##### Properties
- [`issues`](#issues)
- [`name`](#name)
- [`owner`](#owner)
- [`projects`](#projects)
- [`startTimestamp`](#starttimestamp)

##### Methods
- [`addIssue`](#addissue)
- [`containsIssue`](#containsissue)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findChartByName`](#findchartbyname)
- [`removeIssue`](#removeissue)

#### Properties

##### issues

The set of issues that have been added to the Gantt chart.

Readonly  

Return type: `Set.<Issue>`  

##### name

The name of the Gantt chart.

Readonly  

Return type: `String`  

##### owner

The user who created the Gantt chart.

Readonly  

Return type: `User`  

##### projects

The projects that this Gantt chart works with.

Readonly  

Return type: `Set.<Project>`  

##### startTimestamp

The start date for the issues on the Gantt chart.

Readonly  

Return type: `Number`  

#### Methods

##### addIssue

Adds the specified issue to the Gantt chart.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to add to the Gantt chart. |

##### containsIssue

Checks whether the issue belongs to the Gantt chart.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition is checked. |

###### Returns

Return type: `Boolean`.

If the issue belongs to the Gantt chart, returns `true`.

##### findByExtensionProperties

Searches for Gantt entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<Gantt>`.

The set of Gantt entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findChartByName

Finds the most relevant chart with the specified name that is visible to the current user.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the chart to search for. |

###### Returns

Return type: `Gantt`.

The most relevant chart found by name.

##### removeIssue

Removes the specified issue from the Gantt chart. If the issue was not present on the chart, nothing happens.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to remove from the Gantt chart. |

<a id="type-groupprojectcustomfield"></a>
### GroupProjectCustomField

Represents a custom field in a project that stores a UserGroup type.

#### Contents

##### Properties
- [`values`](#values)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findValueByName`](#findvaluebyname)

#### Properties

##### values

The list of available values for the custom field.

Readonly  

Return type: `Set.<UserGroup>`  

#### Methods

##### findByExtensionProperties

Searches for GroupProjectCustomField entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<GroupProjectCustomField>`.

The set of GroupProjectCustomField entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findValueByName

Returns the value that matches the specified name in a custom field that stores values as a user group.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the group to search for in the set of values for the custom field. |

###### Returns

Return type: `UserGroup`.

The group with the specified name. This group can be set as the value for a field that stores a user group.

<a id="type-issue"></a>
### Issue

Represents an issue in YouTrack.

#### Contents

##### Constructors
- [`Issue`](#new-issue)

##### Properties
- [`attachments`](#attachments)
- [`becomesRemoved`](#becomesremoved)
- [`becomesReported`](#becomesreported)
- [`becomesResolved`](#becomesresolved)
- [`becomesUnresolved`](#becomesunresolved)
- [`ccUsers`](#ccusers)
- [`channel`](#channel)
- [`comments`](#comments)
- [`created`](#created)
- [`customerGroups`](#customergroups)
- [`description`](#description)
- [`draftId`](#draftid)
- [`duplicateRoot`](#duplicateroot)
- [`editedComments`](#editedcomments)
- [`editedWorkItems`](#editedworkitems)
- [`extensionProperties`](#extensionproperties)
- [`fields`](#fields)
- [`ganttCharts`](#ganttcharts)
- [`id`](#id)
- [`isNew`](#isnew)
- [`isReported`](#isreported)
- [`isResolved`](#isresolved)
- [`isStarred`](#isstarred)
- [`links`](#links)
- [`mentionedInIssueComments`](#mentionedinissuecomments)
- [`mentionedInIssues`](#mentionedinissues)
- [`numberInProject`](#numberinproject)
- [`permittedGroup`](#permittedgroup)
- [`permittedGroups`](#permittedgroups)
- [`permittedUsers`](#permittedusers)
- [`pinnedComments`](#pinnedcomments)
- [`project`](#project)
- [`pullRequests`](#pullrequests)
- [`reporter`](#reporter)
- [`resolved`](#resolved)
- [`summary`](#summary)
- [`tags`](#tags)
- [`unauthenticatedReporter`](#unauthenticatedreporter)
- [`updatedBy`](#updatedby)
- [`updated`](#updated)
- [`url`](#url)
- [`vcsChanges`](#vcschanges)
- [`voters`](#voters)
- [`votes`](#votes)
- [`watchers`](#watchers)
- [`workItems`](#workitems)

##### Methods
- [`addAttachment`](#addattachment)
- [`addComment`](#addcomment)
- [`addTag`](#addtag)
- [`addWorkItem`](#addworkitem)
- [`afterMinutes`](#afterminutes)
- [`applyCommand`](#applycommand)
- [`clearAttachments`](#clearattachments)
- [`copy`](#copy)
- [`createDraft`](#createdraft)
- [`createSharedDraft`](#createshareddraft)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findById`](#findbyid)
- [`hasTag`](#hastag)
- [`isVisibleTo`](#isvisibleto)
- [`pauseSLA`](#pausesla)
- [`removeTag`](#removetag)
- [`renderMarkup`](#rendermarkup)
- [`resumeSLA`](#resumesla)
- [`setDefaultFieldValues`](#setdefaultfieldvalues)
- [`tag`](#tag)
- [`untag`](#untag)

#### Constructors

##### new Issue

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `reporter` | `User`, `JsonForIssueConstructor` | Issue reporter. Alternatively, pass a JSON specified by JsonForIssueConstructor |
| `project (optional)` | `Project` | Project that the new issue is to belong to. |
| `summary (optional)` | `String` | Issue summary. |

#### Properties

##### attachments

The set of attachments that are attached to the issue.

Readonly  

Return type: `Set.<IssueAttachment>`  

##### becomesRemoved

When `true`, the entity is removed in the current transaction. Otherwise, `false`.
This property can become `true` only in on-change rules when the rule is triggered on the removal of an issue or an article.
In the rule code, the `runOn` rule property must contain the `removal` parameter set to `true`.

Readonly  
Since: `2017.4.37915`  

Return type: `Boolean`  

###### Examples

```javascript
runOn: {removal: true}
```

##### becomesReported

If the issue becomes reported in the current transaction, this property is `true`.

Readonly  

Return type: `Boolean`  

###### Examples

```javascript
if (issue.fields.Subsystem !== null && issue.fields.Assignee === null &&
    (((issue.isChanged('Subsystem') || issue.isChanged('project') && issue.isReported) ||
        issue.becomesReported) {
    issue.fields.Assignee = issue.fields.Subsystem.owner
}
```

##### becomesResolved

If the issue was previously unresolved and is assigned a state that is considered resolved in the current transaction, this property is `true`.

Readonly  

Return type: `Boolean`  

##### becomesUnresolved

If the issue was previously resolved and is assigned a state that is considered unresolved in the current transaction, this property is `true`.

Readonly  

Return type: `Boolean`  

##### ccUsers

The users added as CCs to the helpdesk ticket. The ticket reporter is excluded automatically. Up to 10 reporter-type users can be kept in CC; extra reporters are removed automatically.

Since: `2026.1`  

Return type: `Set.<User>`  

##### channel

The channel used by the reporter to create the ticket. Possible values are 'FeedbackForm' for online forms or 'MailboxChannel' for email.

Readonly  

Return type: `Channel`  

##### comments

A list of comments for the issue.

Readonly  

Return type: `Set.<IssueComment>`  

##### created

The date when the issue was created.

Readonly  

Return type: `Number`  

##### customerGroups

The customer groups this helpdesk ticket is shared with. Members of these groups can view the ticket and add public comments.

Readonly  
Since: `2026.2`  

Return type: `Set.<NestedUserGroup>`  

##### description

The text that is entered as the issue description.

Return type: `String`  

##### draftId

Draft issue ID. Returns `null` if the issue is not a draft.

Readonly  
Since: `2025.3`  

Return type: `String`  

##### duplicateRoot

The root issue in a tree of duplicates that are linked to the issue.
For example, if `issueA` duplicates `issueB` and `issueB` duplicates
`issueC`, then the value for the `issueA.duplicateRoot()` property is `issueC`.

Readonly  

Return type: `Issue`  

##### editedComments

The set of comments that are edited in the current transaction.
Comments that are added and removed are not considered to be edited.
Instead, these are represented by the `issue.comments.added` and `issue.comments.removed` properties.

Readonly  

Return type: `Set.<IssueComment>`  

##### editedWorkItems

The set of work items that are edited in the current transaction.
Work items that are added and removed are not considered to be edited.
Instead, these are represented by the `issue.workItems.added` and
`issue.workItems.removed` properties.

Readonly  
Since: `2017.4.37824`  

Return type: `Set.<IssueWorkItem>`  

##### extensionProperties

The object containing extension properties for this entity and their values.
Extension properties are custom properties that might be added to core YouTrack entities by an app.
For details about extension properties, see https://www.jetbrains.com/help/youtrack/devportal/apps-extension-properties.html.

Since: `2024.3`  

Return type: `Object`  

###### Examples

```javascript
const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.rule = entities.Issue.action({
    command: 'test',
    action: function (ctx) {
        const printValues = () => {
            return 'stringProp:' + ctx.issue.extensionProperties.stringProp + ';'
                + 'integerProp:' + ctx.issue.extensionProperties.integerProp + ';'
                + 'booleanProp:' + ctx.issue.extensionProperties.booleanProp + ';'
                + 'issueProp:' + ctx.issue.extensionProperties.issueProp?.id + ';'
                + 'issuesProp:' + ctx.issue.extensionProperties.issuesProp?.first()?.id + ';'
        }
        ctx.issue.addComment(printValues());
    }
});
```

##### fields

The custom fields that are used in an issue. This is the collection of issue attributes like
`Assignee`, `State`, and `Priority` that are defined in the Custom Fields section of the administrative interface and
can be attached to each project independently.

Issue attributes like `reporter`, `numberInProject`, and `project` are accessed directly.

Return type: `Fields`  

###### Examples

```javascript
if (issue.fields.becomes(ctx.Priority, ctx.Priority.Critical) {
  issue.fields.Assignee = issue.project.leader;
}
```

##### ganttCharts

The collection of Gantt charts that this issue has been added to.

Readonly  
Since: `2022.1`  

Return type: `Set.<Gantt>`  

##### id

The issue ID.

Readonly  

Return type: `String`  

###### Examples

```javascript
user.notify('Issue is overdue', 'Please, look at the issue: ' + issue.id);
```

##### isNew

When `true`, the entity is created in the current transaction. Otherwise, `false`.

Readonly  
Since: `2018.2.42351`  

Return type: `Boolean`  

##### isReported

If the issue is already reported or becomes reported in the current transaction, this property is `true`. To apply changes to an issue draft, use `!issue.isReported`.

Readonly  

Return type: `Boolean`  

###### Examples

```javascript
issue.links['depends on'].forEach(function(dep) {
  if (dep.isReported) {
    assert(dep.State.resolved, 'The issue has unresolved dependencies and thus cannot be set Fixed!');
  }
});
```

##### isResolved

If the issue is currently assigned a state that is considered resolved, this property is `true`.

Readonly  

Return type: `Boolean`  

##### isStarred

If the current user has added the 'Star' to watch the issue, this property is `true`.

Readonly  

Return type: `Boolean`  

##### links

Issue links (e.g. `relates to`, `parent for`, etc.). Each link is a
Set of Issue objects.

Return type: `Object`  

###### Examples

```javascript
if (issue.links['parent for'].added.isNotEmpty()) {
  issue.links['parent for'].added.forEach(function(subtask) {
    subtask.fields.Priority = issue.fields.Priority;
  });
}
```

##### mentionedInIssueComments

The set of issue comments where this issue is mentioned.

Readonly  

Return type: `Set.<IssueComment>`  

##### mentionedInIssues

The set of issues where this issue is mentioned.

Readonly  

Return type: `Set.<Issue>`  

##### numberInProject

The issue number in the project.

Readonly  

Return type: `Number`  

##### permittedGroup

The user group for which the issue is visible. If the property contains a null value, the issue is visible to the All Users group.

Return type: `UserGroup`  

##### permittedGroups

The groups for which the issue is visible when the visibility is restricted to multiple groups.

Return type: `Set.<UserGroup>`  

##### permittedUsers

The list of users for whom the issue is visible.

Return type: `Set.<User>`  

##### pinnedComments

The set of comments that are pinned in the issue.

Readonly  
Since: `2024.1`  

Return type: `Set.<IssueComment>`  

##### project

The project to which the issue is assigned.

Return type: `Project`  

##### pullRequests

The list of pull requests that are associated with the issue.

Readonly  
Since: `2020.3`  

Return type: `Set.<PullRequest>`  

##### reporter

The user who reported (created) the issue.

Readonly  

Return type: `User`  

###### Examples

```javascript
issue.fields.Assignee = issue.reporter;
```

##### resolved

The date and time when the issue was assigned a state that is considered to be resolved.

Readonly  

Return type: `Number`  

##### summary

The text that is entered as the issue summary.

Return type: `String`  

##### tags

The list of tags that are attached to an issue.

Return type: `Set.<Tag>`  

##### unauthenticatedReporter

When true, the ticket was created by a reporter who was not logged in to YouTrack when they submitted the support request.

Readonly  

Return type: `Boolean`  

##### updatedBy

The user who last updated the issue.

Readonly  

Return type: `User`  

##### updated

The date when the issue was last updated.

Readonly  

Return type: `Number`  

##### url

The absolute URL that points to the issue.

Readonly  

Return type: `String`  

###### Examples

```javascript
user.notify('Issue is overdue', 'Please, look at the issue: ' + issue.url);
```

##### vcsChanges

The list of commits that are associated with the issue.

Readonly  
Since: `2018.1.38923`  

Return type: `Set.<VcsChange>`  

##### voters

Users who voted for the issue.

Readonly  
Since: `2020.5`  

Return type: `Set.<User>`  

##### votes

The number of votes for an issue. For vote-related methods, see User.canVoteIssue, User.voteIssue, User.canUnvoteIssue, and User.unvoteIssue.

Readonly  

Return type: `Number`  

##### watchers

Returns the watchers of the issue.

Readonly  
Since: `2025.3`  

Return type: `Set.<User>`  

##### workItems

The set of work items that have been added to the issue.

Readonly  

Return type: `Set.<IssueWorkItem>`  

#### Methods

##### addAttachment

Attaches a file to the issue.
Makes `issue.attachments.isChanged` return `true` for the current transaction.

Since: `2019.2.53994`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `content` | `InputStream`, `String`, `JsonForIssueAddAttachment` | The content of the file in binary form or as a base64 data URI. Base64 content must use the `data:[MIME type];base64,[content]` syntax. Alternatively, pass a JSON specified by JsonForIssueAddAttachment |
| `name (optional)` | `String` | The name of the file. |
| `charset (optional)` | `String` | The charset of the file. Only applicable to text files. |
| `mimeType (optional)` | `String` | The MIME type of the file. |

###### Returns

Return type: `IssueAttachment`.

The attachment that is added to the issue.

##### addComment

Adds a comment to the issue.
Makes `issue.comments.isChanged` return `true` for the current transaction.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `text` | `String`, `JsonForIssueAddComment` | The text to add to the issue as a comment. Alternatively, pass a JSON specified by JsonForIssueAddComment |
| `author (optional)` | `User` | The author of the comment. |

###### Returns

Return type: `IssueComment`.

A newly created comment.

##### addTag

Adds a tag with the specified name to an issue. YouTrack adds the first matching tag that is visible to the current user.
If a match is not found, a new private tag is created for the current user.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to add to the issue. |

###### Returns

Return type: `Tag`.

The tag that has been added to the issue.

##### addWorkItem

Adds a work item to the issue.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `description` | `String`, `JsonForIssueAddWorkItem` | The description of the work item. Alternatively, pass a JSON specified by JsonForIssueAddWorkItem |
| `date (optional)` | `Number` | The date that is assigned to the work item. |
| `author (optional)` | `User` | The user who performed the work. |
| `duration (optional)` | `Number` | The work duration in minutes. |
| `type (optional)` | `WorkItemType` | The work item type. |

###### Returns

Return type: `IssueWorkItem`.

The new work item.

##### afterMinutes

Adds the specified number of minutes to a specified starting point in time.

Since: `2023.1`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `initialTime` | `Number` | A timestamp for the starting point in time. YouTrack adds the specified number of minutes to this point. |
| `minutes` | `Number` | The number of minutes to add to the starting point. |
| `calendar` | `Calendar` | The SLA settings for the business hours that should be considered when adding minutes to the starting point. If the result falls outside the business hours after adding specified minutes, the extra minutes get automatically transferred to the next business day. |
| `considerPauses` | `Boolean` | A switcher that determines whether to consider the effects of the 'pauseSLA' and 'resumeSLA' methods when adding specified minutes to the starting point. |

###### Returns

Return type: `Number`.

A timestamp after adding the specified number of minutes.

##### applyCommand

Applies a command to the issue.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `command` | `String` | The command that is applied to the issue. |
| `runAs` | `User` | Specifies the user by which the command is applied. If this parameter is not set, the command is applied on behalf of the current user. |

##### clearAttachments

Removes all of the attachments from the issue.

##### copy

Creates a copy of the issue.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `project (optional)` | `Project` | Project to create new issue in. Available since 2018.1.40575. |

###### Returns

Return type: `Issue`.

The copy of the original issue.

##### createDraft

Creates a new issue draft.

Since: `2025.1`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `project` | `Project` | Project that the new issue draft is to belong to. |
| `reporter (optional)` | `User` | Issue draft reporter. |

###### Returns

Return type: `Issue`.

Newly created issue draft.

##### createSharedDraft

Creates a new shared issue draft.

Since: `2025.1`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `project` | `Project` | Project that the new issue draft is to belong to. |

###### Returns

Return type: `Issue`.

Newly created issue draft.

##### findByExtensionProperties

Searches for Issue entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<Issue>`.

The set of Issue entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findById

Finds an issue by its visible ID.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `id` | `String` | The issue ID. |

###### Returns

Return type: `Issue`.

The issue that is assigned the specified ID.

###### Examples

```javascript
var myIssue = entities.Issue.findById("NP-15971");
```

##### hasTag

Checks whether the specified tag is attached to an issue.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `tagName` | `String` | The name of the tag to check for the issue. |
| `ignoreVisibilitySettings (optional)` | `Boolean` | When `true`, checks all matching tags without regard to their visibility settings. When `false` (default), checks only matching tags that are visible to the current user. |

###### Returns

Return type: `Boolean`.

If the specified tag is attached to the issue, returns `true`.

##### isVisibleTo

Checks whether the issue is accessible by specified user.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user` | `User` | The user to check. |

###### Returns

Return type: `Boolean`.

If the issue is accessible for the user, returns 'true'.

##### pauseSLA

Pauses the timers for the current SLA applied to the issue.

Since: `2023.1`  

##### removeTag

Removes a tag with the specified name from an issue. If the specified tag is not attached to the issue, nothing happens.
This method first searches through tags owned by the current user, then through all other visible tags.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to remove from the issue. |

###### Returns

Return type: `Tag`.

The tag that has been removed from the issue.

##### renderMarkup

Converts text in markdown to HTML. Use this method to send "pretty" notifications.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `text` | `String` | The string of text to convert to HTML. |

###### Returns

Return type: `String`.

Rendered markdown

###### Examples

```javascript
issue.Assignee.notify('Comment added:', issue.renderMarkup(comment.text));
```

##### resumeSLA

Resumes the timers for the current SLA applied to the issue.

Since: `2023.1`  

##### setDefaultFieldValues

Sets the default custom field values for the issue. Applies only for empty fields.

Since: `2025.3`  

##### tag

Applies the tag to the issue.

Since: `2025.3`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `tag` | `Tag` | The tag object. |

##### untag

Removes the tag from the issue.

Since: `2025.3`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `tag` | `Tag` | The tag object. |

<a id="type-issueattachment"></a>
### IssueAttachment

Represents a file that is attached to an issue.

#### Contents

##### Properties
- [`author`](#author)
- [`base64Content`](#base64content)
- [`content`](#content)
- [`created`](#created)
- [`fileUrl`](#fileurl)
- [`isRemoved`](#isremoved)
- [`issue`](#issue)
- [`metaData`](#metadata)
- [`permittedGroup`](#permittedgroup)
- [`permittedGroups`](#permittedgroups)
- [`permittedUsers`](#permittedusers)
- [`updated`](#updated)

##### Methods
- [`delete`](#delete)
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### author

The user who attached the file to the issue.

Readonly  

Return type: `User`  

##### base64Content

The Base64 representation of the attachment.

Readonly  
Since: `2021.2`  

Return type: `String`  

##### content

The content of the file in binary form.

Readonly  
Since: `2019.2.53994`  

Return type: `InputStream`  

##### created

The date and time when the attachment was created as a timestamp.

Readonly  

Return type: `Number`  

##### fileUrl

The URL of the issue attachment.

Readonly  
Since: `2019.2.56440`  

Return type: `String`  

##### isRemoved

If the attachment is removed, this property is `true`.

Readonly  

Return type: `Boolean`  

##### issue

The issue that the file is attached to.

Readonly  

Return type: `Issue`  

##### metaData

The image dimensions. For image files, the value is rw=_width_&rh=_height_. For non-image files, the value is `empty`.

Readonly  

Return type: `String`  

##### permittedGroup

The group for which the attachment is visible when the visibility is restricted to a single group.

Return type: `UserGroup`  

##### permittedGroups

The groups for which the issue is visible when the visibility is restricted to multiple groups.

Return type: `Set.<UserGroup>`  

##### permittedUsers

The list of users for whom the attachment is visible.

Return type: `Set.<User>`  

##### updated

The date and time the attachment was last updated as a timestamp.

Readonly  

Return type: `Number`  

#### Methods

##### delete

Permanently deletes the attachment.

Since: `2018.1.40030`  

##### findByExtensionProperties

Searches for IssueAttachment entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<IssueAttachment>`.

The set of IssueAttachment entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-issuecomment"></a>
### IssueComment

Represents a comment that is added to an issue.

#### Contents

##### Properties
- [`author`](#author)
- [`deleted`](#deleted)
- [`issue`](#issue)
- [`permittedGroup`](#permittedgroup)
- [`permittedGroups`](#permittedgroups)
- [`permittedUsers`](#permittedusers)
- [`updatedBy`](#updatedby)
- [`url`](#url)

##### Methods
- [`addAttachment`](#addattachment)
- [`delete`](#delete)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`isVisibleTo`](#isvisibleto)

#### Properties

##### author

The user who created the comment.

Readonly  

Return type: `User`  

##### deleted

`true` in case the comment is displayed as removed.

Readonly  
Since: `2020.6.4500`  

Return type: `Boolean`  

##### issue

The issue the comment belongs to.

Readonly  

Return type: `Issue`  

##### permittedGroup

A group who's members are allowed to access the comment.

Return type: `UserGroup`  

##### permittedGroups

Groups whose members are allowed to access the comment.

Return type: `Set.<UserGroup>`  

##### permittedUsers

Users who are allowed to access the comment.

Return type: `Set.<User>`  

##### updatedBy

The user who last updated the comment.

Readonly  

Return type: `User`  

##### url

The absolute URL (permalink) that points to the comment.

Readonly  

Return type: `String`  

###### Examples

```javascript
user.notify('Somebody has written something', 'Have a look: ' + comment.url);
```

#### Methods

##### addAttachment

Attaches a file to the issue comment.
Makes `issue.attachments.isChanged` return `true` for the current transaction.

Since: `2020.6.3400`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `content` | `InputStream`, `String`, `JsonForIssueCommentAddAttachment` | The content of the file in binary or base64 form. Alternatively, pass a JSON specified by JsonForIssueCommentAddAttachment |
| `name (optional)` | `String` | The name of the file. |
| `charset (optional)` | `String` | The charset of the file. Only applicable to text files. |
| `mimeType (optional)` | `String` | The MIME type of the file. |

###### Returns

Return type: `IssueAttachment`.

The attachment that is added to the issue comment.

##### delete

Logically deletes the comment. This means that the comment is marked as deleted, but remains in the database.
Users with sufficient permissions can restore the comment or delete the comment permanently from the user interface.
The option to delete comments permanently has not been implemented in this API.

Since: `2018.1.38923`  

##### findByExtensionProperties

Searches for IssueComment entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<IssueComment>`.

The set of IssueComment entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### isVisibleTo

Checks whether the specified user has access to view the comment.

Since: `2021.1.2300`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user` | `User` | The user to check. |

###### Returns

Return type: `Boolean`.

When 'true', the specified user has access to view the comment. Otherwise, 'false'.

<a id="type-issuelinkprototype"></a>
### IssueLinkPrototype

Represents an issue link type.

#### Contents

##### Properties
- [`inward`](#inward)
- [`outward`](#outward)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findByName`](#findbyname)

#### Properties

##### inward

The inward name of the issue link type.

Readonly  

Return type: `String`  

##### outward

The outward name of the issue link type.

Readonly  

Return type: `String`  

#### Methods

##### findByExtensionProperties

Searches for IssueLinkPrototype entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<IssueLinkPrototype>`.

The set of IssueLinkPrototype entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findByName

Finds an issue link type by its name.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | Name or localized name of an issue link type |

###### Returns

Return type: `IssueLinkPrototype`.

The issue link type.

<a id="type-issuetag"></a>
### IssueTag

Deprecated. Use Tag instead.

Deprecated: 2023.1  

#### Contents

##### Methods
- [`findByName`](#findbyname)
- [`findTagByName`](#findtagbyname)

#### Methods

##### findByName

Deprecated. Use Tag.findByName instead.

Deprecated: 2023.1  

###### Returns

Return type: `Set.<Tag>`.

A list of tags that match the specified name.

##### findTagByName

Deprecated. Use Tag.findTagByName instead.

Deprecated: 2023.1  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to search for. |

###### Returns

Return type: `Tag`.

The most relevant tag.

<a id="type-issueworkitem"></a>
### IssueWorkItem

Represents a work item that has been added to an issue.

#### Contents

##### Properties
- [`attributes`](#attributes)
- [`date`](#date)
- [`duration`](#duration)

##### Methods
- [`delete`](#delete)
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### attributes

Custom work item attributes.

Readonly  
Since: `2024.2`  

Return type: `WorkItemAttributes`  

##### date

The date and time that is assigned to the work item. Stored as a Unix timestamp in UTC. The time part is set to midnight for the current date.

Readonly  

Return type: `Number`  

##### duration

The duration of the work item in minutes.
Writable since 2018.1.40800

Return type: `Number`  

#### Methods

##### delete

Permanently deletes the work item.

Since: `2018.2.42312`  

##### findByExtensionProperties

Searches for IssueWorkItem entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<IssueWorkItem>`.

The set of IssueWorkItem entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-mailboxchannel"></a>
### MailboxChannel

Represents an email channel used in a helpdesk project. Email channels pull messages from an external mail service and process them according to the channel settings.

#### Contents

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Methods

##### findByExtensionProperties

Searches for MailboxChannel entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<MailboxChannel>`.

The set of MailboxChannel entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-ownedfield"></a>
### OwnedField

Represents a value in a custom field that has a user associated with it, a so-called owner.

#### Contents

##### Properties
- [`fieldType`](#fieldtype)
- [`owner`](#owner)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### fieldType

Field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

##### owner

The user who is associated with the value.

Readonly  

Return type: `User`  

#### Methods

##### findByExtensionProperties

Searches for OwnedField entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<OwnedField>`.

The set of OwnedField entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-periodprojectcustomfield"></a>
### PeriodProjectCustomField

Represents a custom field in a project that stores a value as a period type.
We use org.joda.time.Period as a base class for period values.
While you can read the class documentation at
http://joda-time.sourceforge.net/apidocs/org/joda/time/Period.html,
please note that we support only class members which use the Period class and
primitive types like String and int.

#### Contents

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Examples

```javascript
// to convert period to minutes (or other units) use get* methods:
// This example assumes a five-day work week and an eight-hour work day.
// Adjust the conversion if your YouTrack instance uses different time tracking settings.
var period = issue.fields.Estimation;
var minutes = !period ? 0 : (period.getMinutes() +
                             60 * (period.getHours() +
                                   8 * (period.getDays() +
                                        5 * period.getWeeks())));
// To create a Period instance, use the toPeriod function from the date-time module:
issue.fields.Estimation = dateTime.toPeriod(3 * 3600 * 1000); // 3h in ms
issue.fields.Estimation = dateTime.toPeriod('3h'); // short form
issue.fields.Estimation = dateTime.toPeriod('2w4d3h15m'); // full form
```

#### Methods

##### findByExtensionProperties

Searches for PeriodProjectCustomField entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<PeriodProjectCustomField>`.

The set of PeriodProjectCustomField entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-persistentfile"></a>
### PersistentFile

Represents the common ancestor for all persistent files that are available in YouTrack.

#### Contents

##### Properties
- [`charset`](#charset)
- [`extension`](#extension)
- [`mimeType`](#mimetype)
- [`name`](#name)
- [`size`](#size)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### charset

The charset type of the file. Only applicable to text files.

Readonly  
Since: `2019.2.53994`  

Return type: `String`  

##### extension

The extension that defines the file type.

Readonly  

Return type: `String`  

##### mimeType

The MIME type of the file.

Readonly  
Since: `2019.2.53994`  

Return type: `String`  

##### name

The name of the file.

Readonly  

Return type: `String`  

##### size

The size of the attached file in bytes.

Readonly  

Return type: `Number`  

#### Methods

##### findByExtensionProperties

Searches for PersistentFile entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<PersistentFile>`.

The set of PersistentFile entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-project"></a>
### Project

Represents a YouTrack project.

#### Contents

##### Properties
- [`articles`](#articles)
- [`changesProcessors`](#changesprocessors)
- [`defaultVisibilityGroup`](#defaultvisibilitygroup)
- [`description`](#description)
- [`fields`](#fields)
- [`iconUrl`](#iconurl)
- [`isArchived`](#isarchived)
- [`issues`](#issues)
- [`isTimeTrackingEnabled`](#istimetrackingenabled)
- [`key`](#key)
- [`leader`](#leader)
- [`name`](#name)
- [`notificationEmail`](#notificationemail)
- [`projectType`](#projecttype)
- [`sharedChangesProcessors`](#sharedchangesprocessors)
- [`shortName`](#shortname)
- [`team`](#team)
- [`workItemAttributes`](#workitemattributes)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findByKey`](#findbykey)
- [`findByName`](#findbyname)
- [`findFieldByName`](#findfieldbyname)
- [`findWorkItemAttributeByName`](#findworkitemattributebyname)
- [`intervalToWorkingMinutes`](#intervaltoworkingminutes)
- [`isAgent`](#isagent)
- [`newDraft`](#newdraft)

#### Properties

##### articles

A list of all articles that belong to the project.

Readonly  
Since: `2021.4.23500`  

Return type: `Set.<Article>`  

##### changesProcessors

The list of VCS change processors that are integrated with the project.

Readonly  
Since: `2020.3`  

Return type: `Set.<ChangesProcessor>`  

##### defaultVisibilityGroup

The group that is set automatically as the initial default for the Visible to group in new issues and articles in this project.

Readonly  
Since: `2026.2`  

Return type: `UserGroup`  

##### description

The description of the project as shown on the project profile page.

Readonly  

Return type: `String`  

##### fields

The set of custom fields that are available in the project.

Readonly  

Return type: `Set.<ProjectCustomField>`  

##### iconUrl

The absolute URL of the project icon. Returns the custom uploaded icon when present, otherwise the generated default icon, or `null` when the icon URL cannot be produced.

Readonly  
Since: `2026.2`  

Return type: `String`  

##### isArchived

If the project is currently archived, this property is `true`.

Readonly  

Return type: `Boolean`  

##### issues

A list of all issues that belong to the project.

Readonly  

Return type: `Set.<Issue>`  

##### isTimeTrackingEnabled

If the time tracking feature is enabled in the project, this property is `true`.

Readonly  
Since: `2026.1`  

Return type: `Boolean`  

##### key

The ID of the project. Use instead of project.shortName, which is deprecated.

Readonly  

Return type: `String`  

##### leader

The user who is set as the project owner.

Readonly  

Return type: `User`  

##### name

The name of the project.

Readonly  

Return type: `String`  

##### notificationEmail

The email address that is used to send notifications for the project.
If a 'From' address is not set for the project, the default 'From' address for the YouTrack server is returned.

Readonly  

Return type: `String`  

###### Examples

```javascript
if (issue.becomesReported) {
  const lastRelatedEmails = issue.fields['Last message related emails'];
  lastRelatedEmails?.split(' ')?.forEach(function (email) {
    if (email?.equalsIgnoreCase(issue.project.notificationEmail)) {
      const allRelatedEmails = issue.fields['All related emails'];
      if (!allRelatedEmails) {
        issue.fields['All related emails'] = email;
      } else if (!(allRelatedEmails.split(' ').has(email))) {
        issue.fields['All related emails'] = allRelatedEmails + ' ' + email;
      }
    }
  });
  issue.fields['Last message related emails'] = null;
}
```

##### projectType

Determines which basic features are available for use in a project. Possible values are 'standard' or 'helpdesk'.

Readonly  

Return type: `ProjectType`  

##### sharedChangesProcessors

The list of VCS change processors that are shared with the project.

Readonly  
Since: `2025.3`  

Return type: `Set.<ChangesProcessor>`  

##### shortName

Readonly  

Return type: `String`  

##### team

The project team. This UserGroup object contains the users and members of groups who are assigned to the project team.

Readonly  
Since: `2017.4.38235`  

Return type: `UserGroup`  

##### workItemAttributes

Work item attributes configured for the project.

Readonly  
Since: `2024.2`  

Return type: `Set.<WorkItemProjectAttribute>`  

#### Methods

##### findByExtensionProperties

Searches for Project entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<Project>`.

The set of Project entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findByKey

Finds a project by ID.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `key` | `String` | The ID of the project to search for. |

###### Returns

Return type: `Project`.

The project, or null when there are no projects with the specified ID.

##### findByName

Finds a project by name.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the project to search for. |

###### Returns

Return type: `Project`.

The project, or null when there are no projects with the specified name.

##### findFieldByName

Returns the custom field in the project with the specified name.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the custom field. |

###### Returns

Return type: `ProjectCustomField`.

The custom field with the specified name.

##### findWorkItemAttributeByName

Returns work item attribute with the given name or null if it does not exist.

Since: `2024.2`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | Name of the attribute to find by |

###### Returns

Return type: `WorkItemProjectAttribute`.

Work item attribute with the given name or null if it does not exist.

##### intervalToWorkingMinutes

Gets the number of minutes that occurred during working hours in a specified interval.
For example, if the interval is two days and the number of working hours in a day is set to 8, the result is 2 * 8 * 60 = 960

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `start` | `Number` | Start of the interval. |
| `end` | `Number` | End of the interval. |

###### Returns

Return type: `Number`.

The number of minutes that occurred during working hours in the specified interval.

##### isAgent

Checks if the specified user is an agent in the project.

Since: `2023.1`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user` | `User` | The user to check. |

###### Returns

Return type: `Boolean`.

If the specified user is added to agents in the project, returns 'true'.

##### newDraft

Creates a new issue draft.

Since: `2021.4`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `reporter (optional)` | `User` | Issue draft reporter. |

###### Returns

Return type: `Issue`.

Newly created issue draft.

<a id="type-projectcustomfield"></a>
### ProjectCustomField

Represents a custom field that is available in a project.

#### Contents

##### Properties
- [`localizedName`](#localizedname)
- [`name`](#name)
- [`nullValueText`](#nullvaluetext)
- [`typeName`](#typename)

##### Methods
- [`becomesInvisibleInIssue`](#becomesinvisibleinissue)
- [`becomesVisibleInIssue`](#becomesvisibleinissue)
- [`getBackgroundColor`](#getbackgroundcolor)
- [`getForegroundColor`](#getforegroundcolor)
- [`getValuePresentation`](#getvaluepresentation)
- [`isVisibleInIssue`](#isvisibleinissue)

#### Properties

##### localizedName

The localized name of the field.

Readonly  

Return type: `String`  

##### name

The name of the field.

Readonly  

Return type: `String`  

##### nullValueText

The text that is displayed for this field when it is empty.

Readonly  

Return type: `String`  

##### typeName

The data type assigned to values stored in the custom field.

Readonly  

Return type: `String`  

#### Methods

##### becomesInvisibleInIssue

Checks if the changes that are applied in the current transaction remove the condition to show the custom field.

Since: `2018.2.42312`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition for showing the field is checked. |

###### Returns

Return type: `Boolean`.

When `true`, the condition for showing the field is removed in the current transaction.

##### becomesVisibleInIssue

Checks if the changes that are applied in the current transaction satisfy the condition to show the custom field.

Since: `2018.2.42312`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition for showing the field is checked. |

###### Returns

Return type: `Boolean`.

When `true`, the condition for showing the field is met in the current transaction.

##### getBackgroundColor

Returns the background color that is used for this field value in the specified issue.
Can return `null`, `"white"`, or a hex color presentation.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the background color is returned. |

###### Returns

Return type: `String`.

The background color that is used for this field value in the specified issue.

##### getForegroundColor

Returns the foreground color that is used for this field value in the specified issue.
Can return `null`, `"white"`, or a hex color presentation.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the foreground color is returned. |

###### Returns

Return type: `String`.

The foreground color that is used for this field value in the specified issue.

##### getValuePresentation

Returns the string presentation of the value that is stored in this field in the specified issue.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the value presentation is returned. |

###### Returns

Return type: `String`.

The string presentation of the value.

##### isVisibleInIssue

Checks if a field is visible in the issue.

Since: `2018.2.42312`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition for showing the field is checked. |

###### Returns

Return type: `Boolean`.

When `true`, the condition for showing the custom field in the issue has been met. It can also mean that the field is not shown on a conditional basis and is always visible.

###### Examples

```javascript
// The following example checks the issue to see whether a conditional field with the name "Related Activity"
// is currently visible, meaning that the conditions for showing the field have been met.
// If so, the value for the field is set to "Attendance"

action: function (ctx) {
  if (ctx.RelatedActivity.isVisibleInIssue(ctx.issue)) {
    ctx.issue.fields.RelatedActivity.add(ctx.RelatedActivity.Attendance);
  }
},
requirements: {
  RelatedActivity: {
    name: 'Related Activity',
    type: entities.EnumField.fieldType,
    multi: true,
    Attendance: {}
  }
}
```

<a id="type-projectteam"></a>
### ProjectTeam

Represents a project team. To access a project team in a workflow, use the `team` property of a `Project` object, such as `ctx.issue.project.team`, or the `teams` property of a `User` object. In rule requirements, reference a project team as a `UserGroup` by name.

#### Contents

##### Properties
- [`project`](#project)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### project

The project that the team belongs to.

Readonly  
Since: `2025.3`  

Return type: `Project`  

#### Methods

##### findByExtensionProperties

Searches for ProjectTeam entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<ProjectTeam>`.

The set of ProjectTeam entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-projecttype"></a>
### ProjectType

Represents a classification that determines which basic features are available for use in a project.

#### Contents

##### Properties
- [`DEFAULT`](#default)
- [`HELPDESK`](#helpdesk)
- [`typeName`](#typename)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### DEFAULT

Identifies a standard project for issue tracking.

Readonly  

Return type: `ProjectType`  

##### HELPDESK

Identifies a helpdesk project for managing tickets.

Readonly  

Return type: `ProjectType`  

##### typeName

Name of the project type.

Readonly  

Return type: `String`  

#### Methods

##### findByExtensionProperties

Searches for ProjectType entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<ProjectType>`.

The set of ProjectType entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-projectversion"></a>
### ProjectVersion

Represents a value in a custom field that stores a version type.

#### Contents

##### Properties
- [`fieldType`](#fieldtype)
- [`isReleased`](#isreleased)
- [`releaseDate`](#releasedate)
- [`startDate`](#startdate)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### fieldType

Field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

##### isReleased

If the version is released, this property is `true`.

Readonly  

Return type: `Boolean`  

##### releaseDate

The release date that is associated with the version.

Readonly  

Return type: `Number`  

##### startDate

The start date that is associated with the version.

Readonly  

Return type: `Number`  

#### Methods

##### findByExtensionProperties

Searches for ProjectVersion entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<ProjectVersion>`.

The set of ProjectVersion entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-pullrequest"></a>
### PullRequest

Represents a pull or merge request that is attached to an issue.

Since: `2020.3`  

#### Contents

##### Properties
- [`fetched`](#fetched)
- [`id`](#id)
- [`idReadable`](#idreadable)
- [`isNew`](#isnew)
- [`previousState`](#previousstate)
- [`processor`](#processor)
- [`state`](#state)
- [`title`](#title)
- [`url`](#url)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### fetched

The date when the pull request was retrieved from the VCS change processor.

Readonly  

Return type: `Number`  

##### id

A unique identifier.

Readonly  

Return type: `String`  

##### idReadable

Human readable id of pull-request

Readonly  
Since: `2025.2`  

Return type: `String`  

##### isNew

This property is always `false` for pull requests due to technical limitations.
To check whether a pull request was added to an issue in the current transaction, use `ctx.issue.pullRequests.added.isNotEmpty()`.

Readonly  
Since: `2018.2.42351`  

Return type: `Boolean`  

##### previousState

The previous state of the pull request.

Readonly  
Since: `2020.3`  

Return type: `PullRequestState`  

##### processor

The processor for VCS changes that transmitted information about the pull request.

Readonly  

Return type: `ChangesProcessor`  

##### state

The state of the pull request.

Readonly  

Return type: `PullRequestState`  

##### title

The title of the pull request.

Readonly  

Return type: `String`  

##### url

The URL of the pull request.

Readonly  
Since: `2021.1`  

Return type: `String`  

#### Methods

##### findByExtensionProperties

Searches for PullRequest entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<PullRequest>`.

The set of PullRequest entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-pullrequeststate"></a>
### PullRequestState

Represents a pull request state.

Since: `2020.3`  

#### Contents

##### Properties
- [`DECLINED`](#declined)
- [`MERGED`](#merged)
- [`name`](#name)
- [`OPEN`](#open)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### DECLINED

The pull request was declined.

Readonly  

Return type: `PullRequestState`  

##### MERGED

The pull request was merged.

Readonly  

Return type: `PullRequestState`  

##### name

Name of the pull request state.

Readonly  

Return type: `String`  

##### OPEN

The pull request is open.

Readonly  

Return type: `PullRequestState`  

#### Methods

##### findByExtensionProperties

Searches for PullRequestState entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<PullRequestState>`.

The set of PullRequestState entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-savedquery"></a>
### SavedQuery

Represents a saved search.

#### Contents

##### Properties
- [`name`](#name)
- [`owner`](#owner)
- [`query`](#query)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findByName`](#findbyname)
- [`findQueryByName`](#findquerybyname)

#### Properties

##### name

The name of the saved search.

Readonly  

Return type: `String`  

##### owner

The user who created the saved search.

Readonly  

Return type: `User`  

##### query

The search query.

Readonly  

Return type: `String`  

#### Methods

##### findByExtensionProperties

Searches for SavedQuery entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<SavedQuery>`.

The set of SavedQuery entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findByName

Finds a list of saved searches with the specified name. The list only includes saved searches that are visible to the current user.
The saved searches that were created by the current user are returned at the top of the list.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the saved search to search for. |

###### Returns

Return type: `Set.<SavedQuery>`.

A list of saved searches that match the specified name.

##### findQueryByName

Finds the most relevant saved search with the specified name that is visible to the current user.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the saved search to search for. |

###### Returns

Return type: `SavedQuery`.

The most relevant saved search.

<a id="type-simplecalendar"></a>
### SimpleCalendar

Represents a work days calendar in YouTrack.

#### Contents

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Methods

##### findByExtensionProperties

Searches for SimpleCalendar entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<SimpleCalendar>`.

The set of SimpleCalendar entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-simpleprojectcustomfield"></a>
### SimpleProjectCustomField

Base class for custom fields that store simple values like strings and numbers.

#### Contents

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Methods

##### findByExtensionProperties

Searches for SimpleProjectCustomField entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<SimpleProjectCustomField>`.

The set of SimpleProjectCustomField entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-sprint"></a>
### Sprint

Represents a sprint that is associated with an agile board. Each sprint can include issues from one or more projects.

#### Contents

##### Properties
- [`agile`](#agile)
- [`finish`](#finish)
- [`isArchived`](#isarchived)
- [`name`](#name)
- [`start`](#start)

##### Methods
- [`addIssue`](#addissue)
- [`containsIssue`](#containsissue)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`isSwimlane`](#isswimlane)
- [`removeIssue`](#removeissue)

#### Properties

##### agile

The agile board that the sprint belongs to.

Readonly  

Return type: `Agile`  

##### finish

The end date of the sprint.

Readonly  

Return type: `Number`  

##### isArchived

If the sprint is currently archived, this property is `true`.

Readonly  

Return type: `Boolean`  

##### name

The name of the sprint.

Readonly  

Return type: `String`  

##### start

The start date of the sprint.

Readonly  

Return type: `Number`  

#### Methods

##### addIssue

Adds the issue to the sprint.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue that is added to the sprint. |

##### containsIssue

Checks whether the issue belongs to the sprint.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition is checked. |

###### Returns

Return type: `Boolean`.

If the issue belongs to the sprint, returns ``true``.

##### findByExtensionProperties

Searches for Sprint entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<Sprint>`.

The set of Sprint entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### isSwimlane

Checks whether the specified issue is represented as a swimlane on the agile board that the sprint belongs to.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to check. |

###### Returns

Return type: `Boolean`.

If the specified issue is represented as a swimlane in the sprint, returns `true`.

##### removeIssue

Removes the issue from the sprint.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue that is removed from the sprint. |

<a id="type-state"></a>
### State

Represents a value in a custom field that stores a state type.

#### Contents

##### Properties
- [`fieldType`](#fieldtype)
- [`isResolved`](#isresolved)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### fieldType

Field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

##### isResolved

If issues in this state are considered to be resolved, ths property is `true`.

Readonly  

Return type: `Boolean`  

#### Methods

##### findByExtensionProperties

Searches for State entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<State>`.

The set of State entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-tag"></a>
### Tag

Represents a tag.

#### Contents

##### Constructors
- [`Tag`](#new-tag)

##### Properties
- [`name`](#name)
- [`owner`](#owner)
- [`permittedReadUserGroups`](#permittedreadusergroups)
- [`permittedReadUsers`](#permittedreadusers)
- [`permittedTagUserGroups`](#permittedtagusergroups)
- [`permittedTagUsers`](#permittedtagusers)
- [`permittedUpdateUserGroups`](#permittedupdateusergroups)
- [`permittedUpdateUsers`](#permittedupdateusers)
- [`shareGroup`](#sharegroup)
- [`updateShareGroup`](#updatesharegroup)

##### Methods
- [`canBeUsedForArticle`](#canbeusedforarticle)
- [`canBeUsedForIssue`](#canbeusedforissue)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findByName`](#findbyname)
- [`findByOwner`](#findbyowner)
- [`findTagByName`](#findtagbyname)

#### Constructors

##### new Tag

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag. |
| `owner (optional)` | `User` | The owner of the tag. Defaults to the current user. |

#### Properties

##### name

The name of the tag.

Readonly  

Return type: `String`  

##### owner

The user who created the tag.

Readonly  

Return type: `User`  

##### permittedReadUserGroups

The groups of users for whom the tag or saved search is visible.

Readonly  

Return type: `Set.<UserGroup>`  

##### permittedReadUsers

The users for whom the tag or saved search is visible.

Readonly  

Return type: `Set.<User>`  

##### permittedTagUserGroups

The groups of users who can apply the tag.

Readonly  
Since: `2022.1`  

Return type: `Set.<UserGroup>`  

##### permittedTagUsers

The users who can apply the tag.

Readonly  
Since: `2022.1`  

Return type: `Set.<User>`  

##### permittedUpdateUserGroups

The groups of users who are allowed to update the settings for the tag or saved search.

Readonly  

Return type: `Set.<UserGroup>`  

##### permittedUpdateUsers

The users who are allowed to update the settings for the tag or saved search.

Readonly  

Return type: `Set.<User>`  

##### shareGroup

The group of users for whom the tag or saved search is visible.
If the tag or the saved search is only visible to its owner, the value for this property is `null`.
Use `folder.permittedReadUserGroups` and `folder.permittedReadUsers` instead.

Readonly  

Return type: `UserGroup`  

##### updateShareGroup

The group of users who are allowed to update the settings for the tag or saved search.
If the tag or the saved search can only be updated by its owner, the value for this property is `null`.
Use `folder.permittedUpdateUserGroups` and `folder.permittedUpdateUsers` instead.

Readonly  

Return type: `UserGroup`  

#### Methods

##### canBeUsedForArticle

Checks whether a user has permission to use the tag in the specified article.

Since: `2025.3`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `article` | `BaseArticle` | The article to tag. |
| `user` | `User` | The user to check. Defaults to the current user. |

###### Returns

Return type: `Boolean`.

If the user can tag the article, returns `true`.

##### canBeUsedForIssue

Checks whether a user has permission to use the tag in the specified issue.

Since: `2025.3`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to tag. |
| `user` | `User` | The user to check. Defaults to the current user. |

###### Returns

Return type: `Boolean`.

If the user can tag the issue, returns `true`.

##### findByExtensionProperties

Searches for Tag entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<Tag>`.

The set of Tag entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findByName

Finds a set of tags with the specified name. The tags that were created by the current user are returned at the top of the list.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to search for. |
| `ignoreVisibilitySettings (optional)` | `Boolean` | When `true`, returns all matching tags without regard to their visibility settings. When `false` (default), returns only matching tags that are visible to the current user. |

###### Returns

Return type: `Set.<Tag>`.

The set of tags that match the specified name.

##### findByOwner

Finds tags owned by a specified user without considering the visibility settings for the tags.

Since: `2025.3`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `owner` | `User` | The owner of the tags to find. |

###### Returns

Return type: `Set.<Tag>`.

The set of tags with the specified owner.

##### findTagByName

Finds the most relevant tag with the specified name that is visible to the current user.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to search for. |

###### Returns

Return type: `Tag`.

The most relevant tag.

<a id="type-textprojectcustomfield"></a>
### TextProjectCustomField

Represents a custom field that stores a string of characters as text. When displayed in an issue, the text is shown as formatted in Markdown.

#### Contents

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Methods

##### findByExtensionProperties

Searches for TextProjectCustomField entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<TextProjectCustomField>`.

The set of TextProjectCustomField entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-user"></a>
### User

Represents a user account in YouTrack.

#### Contents

##### Properties
- [`attributes`](#attributes)
- [`avatarUrl`](#avatarurl)
- [`current`](#current)
- [`email`](#email)
- [`fieldType`](#fieldtype)
- [`firstDayOfWeeks`](#firstdayofweeks)
- [`fullName`](#fullname)
- [`groups`](#groups)
- [`isBanned`](#isbanned)
- [`isEmailVerified`](#isemailverified)
- [`isOnline`](#isonline)
- [`isSystem`](#issystem)
- [`language`](#language)
- [`login`](#login)
- [`pinnedSavedQueries`](#pinnedsavedqueries)
- [`registered`](#registered)
- [`ringId`](#ringid)
- [`teams`](#teams)
- [`timeZoneId`](#timezoneid)
- [`type`](#type)
- [`visibleName`](#visiblename)

##### Methods
- [`canLinkIssue`](#canlinkissue)
- [`canUnvoteIssue`](#canunvoteissue)
- [`canVoteIssue`](#canvoteissue)
- [`findByEmail`](#findbyemail)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findByLogin`](#findbylogin)
- [`findUniqueByEmail`](#finduniquebyemail)
- [`getSharedTag`](#getsharedtag)
- [`getTag`](#gettag)
- [`hasPermission`](#haspermission)
- [`hasRole`](#hasrole)
- [`isInGroup`](#isingroup)
- [`isVotedForIssue`](#isvotedforissue)
- [`isWatchingIssue`](#iswatchingissue)
- [`notify`](#notify)
- [`notifyOnCase`](#notifyoncase)
- [`sendMail`](#sendmail)
- [`unvoteIssue`](#unvoteissue)
- [`unwatchArticle`](#unwatcharticle)
- [`unwatchIssue`](#unwatchissue)
- [`voteIssue`](#voteissue)
- [`watchArticle`](#watcharticle)
- [`watchIssue`](#watchissue)

#### Properties

##### attributes

Custom user attributes.

Readonly  
Since: `2021.1.7000`  

Return type: `UserAttributes`  

##### avatarUrl

The absolute URL of the image that is used as the avatar for a user account. May point to an external service, like Gravatar.

Readonly  
Since: `2019.3`  

Return type: `String`  

##### current

The current (logged in) user.

Readonly  

Return type: `User`  

##### email

The email address of the user.

Readonly  

Return type: `String`  

##### fieldType

Field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

##### firstDayOfWeeks

First day of week as set in the user's profile settings. 0 is for Sunday, 1 is for Monday, etc.

Readonly  
Since: `2019.1.50122`  

Return type: `Number`  

##### fullName

The full name of the user as seen in their profile.

Readonly  

Return type: `String`  

##### groups

The list of user's groups.

Readonly  
Since: `2025.3`  

Return type: `Set.<NestedUserGroup>`  

##### isBanned

If the user is currently banned, this property is `true`.

Readonly  

Return type: `Boolean`  

##### isEmailVerified

Indicates whether the user has a verified email address in their profile.

Readonly  
Since: `2023.1`  

Return type: `Boolean`  

##### isOnline

If the user has interacted with YouTrack in any way within the last five minutes.

Readonly  
Since: `2022.1`  

Return type: `Boolean`  

##### isSystem

When `true`, the user functions as a system user. System users are user accounts utilized for running imports, integrations, and other automations.

Readonly  
Since: `2022.2`  

Return type: `Boolean`  

##### language

The display language selected in the general settings of the user profile.

Readonly  
Since: `2022.1`  

Return type: `String`  

##### login

The login of the user.

Readonly  

Return type: `String`  

##### pinnedSavedQueries

Returns pinned by the user saved queries.

Readonly  
Since: `2025.3`  

Return type: `Set.<SavedQuery>`  

##### registered

The date when the user was registered.

Readonly  
Since: `2024.3`  

Return type: `Number`  

##### ringId

ID of the user in Hub. You can use this ID for operations in Hub, and for matching users between YouTrack and Hub.

Readonly  
Since: `2020.6.3000`  

Return type: `String`  

##### teams

The list of project teams that the user belongs to.

Readonly  
Since: `2025.3`  

Return type: `Set.<ProjectTeam>`  

##### timeZoneId

The ID of the local time zone selected in the general settings of the user profile.

Readonly  

Return type: `String`  

##### type

The user type assigned to the user account for licensing purposes. Possible values include: `UserType.STANDARD_USER` (a standard user), `UserType.AGENT` (a helpdesk agent), and `UserType.REPORTER` (a helpdesk reporter).

Readonly  
Since: `2026.2`  

Return type: `UserType`  

##### visibleName

The full name of the user or the login if the full name is not set.

Readonly  

Return type: `String`  

#### Methods

##### canLinkIssue

Checks whether the user is permitted to link the specified issue to any other issue.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to link. |

###### Returns

Return type: `Boolean`.

If the user can link the issue, returns `true`.

##### canUnvoteIssue

Checks whether the user is able to remove their vote from the specified issue.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to check. |

###### Returns

Return type: `Boolean`.

If the user can vote for the issue, returns `true`.

##### canVoteIssue

Checks whether the user is able to vote for the specified issue.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to check. |

###### Returns

Return type: `Boolean`.

If the user can vote for the issue, returns `true`.

##### findByEmail

Finds users by email.

Since: `2018.2.41100`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `email` | `String` | The email to search for. |

###### Returns

Return type: `Set.<User>`.

Users with the specified email.

##### findByExtensionProperties

Searches for User entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<User>`.

The set of User entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findByLogin

Finds a user by login.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `login` | `String` | The login of the user account to search for. |

###### Returns

Return type: `User`.

The specified user, or null when a user with the specified login is not found.

##### findUniqueByEmail

Finds a user by email.

Since: `2018.2.41100`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `email` | `String` | The email of the user account to search for. |

###### Returns

Return type: `User`.

The specified user, or null when a user with the specified email is not found or there are multiple users with the specified email.

##### getSharedTag

Returns a tag with the specified name that is shared with but not owned by the user. If such a tag does not exist, a null value is returned.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag. |

###### Returns

Return type: `Tag`.

The tag.

##### getTag

Returns a tag that is visible to the user.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag. |
| `createIfNotExists` | `Boolean` | If `true` and the specified tag does not exist or is not visible to the user and the user has permission to create tags, a new tag with the specified name is created. |

###### Returns

Return type: `Tag`.

The tag.

##### hasPermission

Checks whether the user has the specified permission.

Since: `2025.3`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `permissionKey` | `String` | The permission key to check. For the complete list of available permission keys, see https://www.jetbrains.com/help/youtrack/devportal/app-permissions.html. |
| `project (optional)` | `Project` | The project to check for the specified permission assignment. If omitted, checks if the user has the global role. |

###### Returns

Return type: `Boolean`.

If the user has the permission, returns `true`.

##### hasRole

Checks whether the user is granted the specified role in the specified project. When the project parameter is not specified, checks whether the user has the specified role in any project.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `roleName` | `String` | The name of the role to check for. |
| `project (optional)` | `Project` | The project to check for the specified role assignment. If omitted, checks whether the user has the specified role in any project. |

###### Returns

Return type: `Boolean`.

If the user is granted the specified role, returns `true`.

##### isInGroup

Checks whether the user is a member of the specified group.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `groupName` | `String` | The name of the group to check for. |

###### Returns

Return type: `Boolean`.

If the user is a member of the specified group, returns `true`.

##### isVotedForIssue

Check whether the user has voted for the specified issue.

Since: `2025.3`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to check the vote is added. |

###### Returns

Return type: `Boolean`.

If the user has voted for the issue, returns `true`.

##### isWatchingIssue

Checks whether the current user is added as a watcher for the specified issue.

Since: `2025.3`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to check for the watcher assignment. |

###### Returns

Return type: `Boolean`.

If the user is added as a watcher for the issue, returns `true`.

##### notify

Sends an email notification to the email address that is set in the user profile.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `subject` | `String`, `JsonForUserNotify` | The subject line of the email notification. Alternatively, pass a JSON specified by JsonForUserNotify |
| `body (optional)` | `String` | The message text of the email notification. |
| `ignoreNotifyOnOwnChangesSetting (optional)` | `Boolean` | If `false`, the message is not sent when changes are performed on behalf of the current user. Otherwise, the message is sent anyway. |
| `project (optional)` | `Project` | When set, the email address that is used as the 'From' address for the specified project is used to send the message. |

##### notifyOnCase

Sends a notification to all notification channels configured for the user.

Since: `2023.1`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `caseName` | `string` | The name of the notification case as seen on the notification templates configuration page. |
| `parameters (optional)` | `Object` | A JSON object that provides required parameters for the notification to render. Particular parameters depend on the notification case. |
| `projectDocument (optional)` | `Issue`, `Article` | An issue or an article that this notification is about. The difference between providing it as a separately vs. passing it among other parameters is that in the former case the notification will be merged with other notifications on that issue/article. |

##### sendMail

Sends an email notification to the email address that is set in the user profile. An alias for notify(subject, body, true).

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `subject` | `String` | The subject line of the email notification. |
| `body` | `String` | The message text of the email notification. |

##### unvoteIssue

Removes a vote on behalf of the user from the issue, if allowed.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue from which the vote is removed. |

##### unwatchArticle

Removes the current user from the list of watchers for the article
(removes the `Star`).

Since: `2023.1`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `article` | `BaseArticle` | The article from which the user is removed as a watcher. |

##### unwatchIssue

Removes the current user from the list of watchers for the issue
(removes the `Star`).

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue from which the user is removed as a watcher. |

##### voteIssue

Adds a vote on behalf of the user to the issue, if allowed.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to which the vote is added. |

##### watchArticle

Adds the current user to the article as a watcher (adds the `Star`).

Since: `2023.1`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `article` | `BaseArticle` | The article to which the user is added as a watcher. |

##### watchIssue

Adds the current user to the issue as a watcher (adds the `Star`).

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to which the user is added as a watcher. |

<a id="type-usercondition"></a>
### UserCondition

Represents a value-based condition for a custom field in a specific project, where the field stores references to a user.

Since: `2025.3`  

#### Contents

##### Properties
- [`bundleElement`](#bundleelement)
- [`possibleValues`](#possiblevalues)

#### Properties

##### bundleElement

The value of the field that is used to determine the set of `possibleValues` in the conditional field.

Readonly  
Since: `2025.3`  

Return type: `Field`  

##### possibleValues

The set of possible user values for the conditional field.

Readonly  
Since: `2025.3`  

Return type: `Set.<User>`  

<a id="type-usergroup"></a>
### UserGroup

Represents a group of users.

#### Contents

##### Properties
- [`allUsersGroup`](#allusersgroup)
- [`customerGroupProjects`](#customergroupprojects)
- [`description`](#description)
- [`fieldType`](#fieldtype)
- [`isAllUsersGroup`](#isallusersgroup)
- [`isAutoJoin`](#isautojoin)
- [`isCustomerGroup`](#iscustomergroup)
- [`name`](#name)
- [`users`](#users)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findByName`](#findbyname)
- [`notifyAllUsers`](#notifyallusers)

#### Properties

##### allUsersGroup

The All Users group.

Readonly  

Return type: `UserGroup`  

##### customerGroupProjects

The set of helpdesk projects where this group is configured as a customer group. For groups that are not customer groups, this property is an empty set.

Readonly  
Since: `2026.2`  

Return type: `Set.<Project>`  

##### description

The description of the group.

Readonly  

Return type: `String`  

##### fieldType

Field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

##### isAllUsersGroup

If the group is the All Users group, this property is `true`.

Readonly  

Return type: `Boolean`  

##### isAutoJoin

If the auto-join option is enabled for the group, this property is `true`.

Readonly  

Return type: `Boolean`  

##### isCustomerGroup

If this group is a helpdesk customer group, this property is `true`.

Readonly  
Since: `2026.2`  

Return type: `Boolean`  

##### name

The name of the group.

Readonly  

Return type: `String`  

##### users

A list of users who are members of the group.

Readonly  

Return type: `Set.<User>`  

#### Methods

##### findByExtensionProperties

Searches for UserGroup entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<UserGroup>`.

The set of UserGroup entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findByName

Finds a group by name.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the group to search for. |

###### Returns

Return type: `UserGroup`.

The specified user group, or null when a group with the specified name is not found.

##### notifyAllUsers

Sends an email notification to all of the users who are members of the group.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `subject` | `String` | The subject line of the email notification. |
| `body` | `String` | The message text of the email notification. |

###### Examples

```javascript
issue.oldValue('permittedGroup').notifyAllUsers('Visibility has been changed',
  'The visibility group for the issue ' + issue.getId() +
  ' has been changed to ' + permittedGroup.name);
```

<a id="type-userprojectcustomfield"></a>
### UserProjectCustomField

Represents a custom field in a project that stores values as a user type.

#### Contents

##### Properties
- [`defaultUsers`](#defaultusers)
- [`valuesCondition`](#valuescondition)
- [`values`](#values)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findValueByLogin`](#findvaluebylogin)
- [`getPossibleValuesForIssue`](#getpossiblevaluesforissue)
- [`isValuePermittedInIssue`](#isvaluepermittedinissue)

#### Properties

##### defaultUsers

The default value for the custom field.

Readonly  

Return type: `Set.<User>`  

##### valuesCondition

The condition that determines which values are possible for this field based on the condition field value. If not set, all values are possible.

Readonly  
Since: `2025.3`  

Return type: `FieldBasedUserValuesCondition`  

##### values

The list of available values for the custom field.

Readonly  

Return type: `Set.<User>`  

#### Methods

##### findByExtensionProperties

Searches for UserProjectCustomField entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<UserProjectCustomField>`.

The set of UserProjectCustomField entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findValueByLogin

Returns the value that matches the specified login in a custom field that stores values as a user type.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `login` | `String` | The user login to search for in the set of values for the custom field. |

###### Returns

Return type: `User`.

The user with the specified login. This user can be set as the value for a field that stores a user type.

##### getPossibleValuesForIssue

The list of possible custom field values based on the value-based conditions in the project settings and the current value stored in the issue. If there are no value-based conditions in the project settings, returns the complete list of values for the custom field.

Since: `2025.3`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the value is checked. |

###### Returns

Return type: `Set.<User>`.

The set of possible users.

##### isValuePermittedInIssue

Checks if value is permitted in the issue.

Since: `2025.2`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the value is checked. |
| `value` | `User` | The value to check. |

###### Returns

Return type: `Boolean`.

If the value can be used for the issue, returns `true`.

<a id="type-usertype"></a>
### UserType

Represents a classification that defines access to advanced helpdesk features and are used to regulate the pricing associated with each user account in YouTrack.

Since: `2026.2`  

#### Contents

##### Properties
- [`AGENT`](#agent)
- [`REPORTER`](#reporter)
- [`STANDARD_USER`](#standard_user)
- [`typeName`](#typename)

#### Properties

##### AGENT

Identifies an agent in a helpdesk project.

Readonly  

Return type: `UserType`  

##### REPORTER

Identifies a reporter who can submit tickets in helpdesk projects.

Readonly  

Return type: `UserType`  

##### STANDARD_USER

Identifies a standard user account.

Readonly  

Return type: `UserType`  

##### typeName

Name of the user type.

Readonly  
Since: `2026.2`  

Return type: `String`  

<a id="type-vcschange"></a>
### VcsChange

Represents a commit that is attached to an issue.

Since: `2018.1.38923`  

#### Contents

##### Properties
- [`changesProcessors`](#changesprocessors)
- [`created`](#created)
- [`date`](#date)
- [`fetched`](#fetched)
- [`id`](#id)
- [`isNew`](#isnew)
- [`version`](#version)

##### Methods
- [`extractCommands`](#extractcommands)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`getUrl`](#geturl)
- [`isVisibleTo`](#isvisibleto)

#### Properties

##### changesProcessors

The list of change processors that the VCS change can be retrieved from.

Readonly  
Since: `2018.1.38923`  

Return type: `Set.<ChangesProcessor>`  

##### created

The date when the change was applied, as returned by the VCS.

Readonly  
Since: `2018.1.39547`  

Return type: `Number`  

##### date

The date when the change was applied, as returned by the VCS.
Use `VcsChange.created` instead.

Readonly  
Since: `2018.1.38923`  
Deprecated: 2018.1.39547  

Return type: `Number`  

##### fetched

The date when the VCS change was retrieved from the change processor.

Readonly  
Since: `2018.1.39547`  

Return type: `Number`  

##### id

A unique identifier. Used by some CI servers in addition to version.

Readonly  
Since: `2018.1.38923`  

Return type: `Number`  

##### isNew

This property is always `false` for VCS changes due to technical limitations.
To check whether a commit was added to an issue in the current transaction, use `ctx.issue.vcsChanges.added.isNotEmpty()`.

Readonly  
Since: `2018.2.42351`  

Return type: `Boolean`  

##### version

The version number of the change. For a Git-based VCS, the revision hash.

Readonly  
Since: `2018.1.38923`  

Return type: `String`  

#### Methods

##### extractCommands

Extracts commands from vcs change on behalf of provided user

Since: `2024.4.52947`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user` | `User` | The user to act as. |

###### Returns

Return type: `Array`.

List of commands that can be extracted from vcs change by provided user

##### findByExtensionProperties

Searches for VcsChange entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<VcsChange>`.

The set of VcsChange entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### getUrl

Returns the URL for a specific VCS change.

Since: `2021.2`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `processor` | `ChangesProcessor` | The entity that retrieved the VCS change and created its representation in YouTrack. |

###### Returns

Return type: `String`.

The URL of the VCS change.

##### isVisibleTo

Checks whether the specified user has access to view the VCS change.

Since: `2020.1.1331`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user` | `User` | The user to check. |

###### Returns

Return type: `Boolean`.

When 'true', the specified user has access to view the VCS change. Otherwise, 'false'.

<a id="type-vcsserver"></a>
### VcsServer

Represents a VCS server.

Since: `2018.1.38923`  

#### Contents

##### Properties
- [`url`](#url)

#### Properties

##### url

The URL of the VCS server.

Readonly  
Since: `2018.1.38923`  

Return type: `String`  

<a id="type-watchfolder"></a>
### WatchFolder

Represents a common ancestor of classes that represent tags and saved searches.

#### Contents

##### Properties
- [`permittedReadUserGroups`](#permittedreadusergroups)
- [`permittedReadUsers`](#permittedreadusers)
- [`permittedUpdateUserGroups`](#permittedupdateusergroups)
- [`permittedUpdateUsers`](#permittedupdateusers)
- [`shareGroup`](#sharegroup)
- [`updateShareGroup`](#updatesharegroup)

#### Properties

##### permittedReadUserGroups

The groups of users for whom the tag or saved search is visible.

Readonly  

Return type: `Set.<UserGroup>`  

##### permittedReadUsers

The users for whom the tag or saved search is visible.

Readonly  

Return type: `Set.<User>`  

##### permittedUpdateUserGroups

The groups of users who are allowed to update the settings for the tag or saved search.

Readonly  

Return type: `Set.<UserGroup>`  

##### permittedUpdateUsers

The users who are allowed to update the settings for the tag or saved search.

Readonly  

Return type: `Set.<User>`  

##### shareGroup

The group of users for whom the tag or saved search is visible.
If the tag or the saved search is only visible to its owner, the value for this property is `null`.
Use `folder.permittedReadUserGroups` and `folder.permittedReadUsers` instead.

Readonly  

Return type: `UserGroup`  

##### updateShareGroup

The group of users who are allowed to update the settings for the tag or saved search.
If the tag or the saved search can only be updated by its owner, the value for this property is `null`.
Use `folder.permittedUpdateUserGroups` and `folder.permittedUpdateUsers` instead.

Readonly  

Return type: `UserGroup`  

<a id="type-workitemattributevalue"></a>
### WorkItemAttributeValue

Value of a work item attribute.

Since: `2022.2`  

#### Contents

##### Properties
- [`name`](#name)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)

#### Properties

##### name

Name of the attribute value

Readonly  

Return type: `String`  

#### Methods

##### findByExtensionProperties

Searches for WorkItemAttributeValue entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<WorkItemAttributeValue>`.

The set of WorkItemAttributeValue entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

<a id="type-workitemprojectattribute"></a>
### WorkItemProjectAttribute

Work item attribute configured for the project.

Since: `2024.2`  

#### Contents

##### Properties
- [`name`](#name)
- [`values`](#values)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findValueByName`](#findvaluebyname)

#### Properties

##### name

Name of the attribute.

Readonly  

Return type: `String`  

##### values

Possible values of the attribute in the project.

Readonly  
Since: `2024.2`  

Return type: `Set.<WorkItemAttributeValue>`  

#### Methods

##### findByExtensionProperties

Searches for WorkItemProjectAttribute entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<WorkItemProjectAttribute>`.

The set of WorkItemProjectAttribute entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findValueByName

Returns the attribute value with the given name or null if such value does not exist.

Since: `2024.2`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | Name of a work item value. |

###### Returns

Return type: `WorkItemAttributeValue`.

The attribute value with the given name or null if such value does not exist.

<a id="type-workitemtype"></a>
### WorkItemType

Represents a work type that can be assigned to a work item.

#### Contents

##### Properties
- [`name`](#name)

##### Methods
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findByProject`](#findbyproject)

#### Properties

##### name

The name of the work item type.

Readonly  

Return type: `String`  

#### Methods

##### findByExtensionProperties

Searches for WorkItemType entities with extension properties that match the specified query.

Since: `2024.3.43260`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

###### Returns

Return type: `Set.<WorkItemType>`.

The set of WorkItemType entities that contain the specified extension properties.

###### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

##### findByProject

Returns the set of work item types that are available in a project.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `project` | `Project` | The project for which work item types are returned. |

###### Returns

Return type: `Set.<WorkItemType>`.

The set of available work item types for the specified project.

<a id="types-additional-entities"></a>
## Additional Entities
- [`Fields`](#type-fields)
- [`Iterator`](#type-iterator)
- [`JsonForArticleAddAttachment`](#type-jsonforarticleaddattachment)
- [`JsonForArticleAddComment`](#type-jsonforarticleaddcomment)
- [`JsonForArticleConstructor`](#type-jsonforarticleconstructor)
- [`JsonForIssueAddAttachment`](#type-jsonforissueaddattachment)
- [`JsonForIssueAddComment`](#type-jsonforissueaddcomment)
- [`JsonForIssueAddWorkItem`](#type-jsonforissueaddworkitem)
- [`JsonForIssueCommentAddAttachment`](#type-jsonforissuecommentaddattachment)
- [`JsonForIssueConstructor`](#type-jsonforissueconstructor)
- [`JsonForUserNotify`](#type-jsonforusernotify)
- [`Set`](#type-set)
- [`UserAttributes`](#type-userattributes)
- [`WorkItemAttributes`](#type-workitemattributes)

<a id="type-fields"></a>
### Fields

Represents the custom fields that are used in an issue.
The actual set of custom fields that are used for each issue is configured on a per-project basis.
The properties shown here correspond with the default custom fields in YouTrack.
Additional custom fields that have been attached to a project are also available.

Type: `Object`  

#### Contents

##### Methods
- [`becomes`](#becomes)
- [`canBeReadBy`](#canbereadby)
- [`canBeWrittenBy`](#canbewrittenby)
- [`isChanged`](#ischanged)
- [`oldValue`](#oldvalue)
- [`required`](#required)

#### Methods

##### becomes

Checks whether the value for a custom field is set to an expected value in the current transaction.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `field` | `string`, `ProjectCustomField` | The field to check. |
| `expected` | `Object` | The expected value. |

###### Returns

Return type: `boolean`.

If the field is set to the expected value, returns `true`.

##### canBeReadBy

Checks whether a user has permission to read the custom field.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `field` | `string`, `ProjectCustomField` | The custom field to check for read access. |
| `user` | `User` | The user for whom the permission to read the custom field is checked. |

###### Returns

Return type: `boolean`.

If the user can read the field, returns `true`.

##### canBeWrittenBy

Checks whether a user has permission to update the custom field.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `field` | `string`, `ProjectCustomField` | The custom field to check for update access. |
| `user` | `User` | The user for whom the permission to update the custom field is checked. |

###### Returns

Return type: `boolean`.

If the user can update the field, returns `true`.

##### isChanged

Checks whether the custom field is changed in the current transaction.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `field` | `string`, `ProjectCustomField` | The name of the custom field (for example, 'State') or a reference to the field that is checked. |

###### Returns

Return type: `boolean`.

If the value of the field is changed in the current transaction, returns `true`.

##### oldValue

Returns the previous value of a single-valued custom field before an update was applied. If the field is not changed
in the transaction, returns null.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `field` | `string`, `ProjectCustomField` | The name of the custom field (for example, 'State') or a reference to the field for which the previous value is returned. |

###### Returns

Return type: `Object`.

If the custom field is changed in the current transaction, the previous value of the field. Otherwise, the current value of the field.

##### required

Asserts that a value is set for a custom field.
If a value for the required field is not set, the specified message is displayed in the user interface.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the custom field to check. |
| `message` | `string` | The message that is displayed to the user that describes the field requirement. |

<a id="type-iterator"></a>
### Iterator

An object that enables traversal through the elements in a collection.

Type: `Object`  

#### Contents

##### Methods
- [`next`](#next)

#### Methods

##### next

###### Returns

Return type: `Object`.

An object that contains values for the properties `done` and `value` properties.
If there are elements that were not traversed, `done` is `false` and `value` is the next element in the collection.
If all of the elements were traversed, `done` is `true` and `value` is `null`.

<a id="type-jsonforarticleaddattachment"></a>
### JsonForArticleAddAttachment

Type: `object`  

#### Contents

##### Properties
- `content`
- `name`
- `charset`
- `mimeType`

#### Properties

| Name | Type | Description |
| --- | --- | --- |
| `content` | `InputStream`, `String` | The content of the file in binary or base64 form. |
| `name` | `String` | The name of the file. |
| `charset` | `String` | The charset of the file. Only applicable to text files. |
| `mimeType` | `String` | The MIME type of the file. |

<a id="type-jsonforarticleaddcomment"></a>
### JsonForArticleAddComment

Type: `object`  

#### Contents

##### Properties
- `text`
- `author`

#### Properties

| Name | Type | Description |
| --- | --- | --- |
| `text` | `String` | The text to add to the article as a comment. |
| `author (optional)` | `User` | The author of the comment. |

<a id="type-jsonforarticleconstructor"></a>
### JsonForArticleConstructor

Type: `object`  

#### Contents

##### Properties
- `author`
- `project`
- `summary`

#### Properties

| Name | Type | Description |
| --- | --- | --- |
| `author` | `User` | The author of the article. |
| `project` | `Project` | The project where the new article is created. |
| `summary` | `String` | The article title. |

<a id="type-jsonforissueaddattachment"></a>
### JsonForIssueAddAttachment

Type: `object`  

#### Contents

##### Properties
- `content`
- `name`
- `charset`
- `mimeType`

#### Properties

| Name | Type | Description |
| --- | --- | --- |
| `content` | `InputStream`, `String` | The content of the file in binary form or as a base64 data URI. Base64 content must use the `data:[MIME type];base64,[content]` syntax. |
| `name` | `String` | The name of the file. |
| `charset` | `String` | The charset of the file. Only applicable to text files. |
| `mimeType` | `String` | The MIME type of the file. |

<a id="type-jsonforissueaddcomment"></a>
### JsonForIssueAddComment

Type: `object`  

#### Contents

##### Properties
- `text`
- `author`

#### Properties

| Name | Type | Description |
| --- | --- | --- |
| `text` | `String` | The text to add to the issue as a comment. |
| `author (optional)` | `User` | The author of the comment. |

<a id="type-jsonforissueaddworkitem"></a>
### JsonForIssueAddWorkItem

Type: `object`  

#### Contents

##### Properties
- `description`
- `date`
- `author`
- `duration`
- `type`

#### Properties

| Name | Type | Description |
| --- | --- | --- |
| `description` | `String` | The description of the work item. |
| `date (optional)` | `Number` | The date that is assigned to the work item. |
| `author (optional)` | `User` | The user who performed the work. |
| `duration` | `Number` | The work duration in minutes. |
| `type (optional)` | `WorkItemType` | The work item type. |

<a id="type-jsonforissuecommentaddattachment"></a>
### JsonForIssueCommentAddAttachment

Type: `object`  

#### Contents

##### Properties
- `content`
- `name`
- `charset`
- `mimeType`

#### Properties

| Name | Type | Description |
| --- | --- | --- |
| `content` | `InputStream`, `String` | The content of the file in binary or base64 form. |
| `name` | `String` | The name of the file. |
| `charset` | `String` | The charset of the file. Only applicable to text files. |
| `mimeType` | `String` | The MIME type of the file. |

<a id="type-jsonforissueconstructor"></a>
### JsonForIssueConstructor

Type: `object`  

#### Contents

##### Properties
- `reporter`
- `project`
- `summary`

#### Properties

| Name | Type | Description |
| --- | --- | --- |
| `reporter` | `User` | Issue reporter. |
| `project` | `Project` | Project that the new issue is to belong to. |
| `summary` | `String` | Issue summary. |

<a id="type-jsonforusernotify"></a>
### JsonForUserNotify

Type: `object`  

#### Contents

##### Properties
- `subject`
- `body`
- `ignoreNotifyOnOwnChangesSetting`
- `project`

#### Properties

| Name | Type | Description |
| --- | --- | --- |
| `subject` | `String` | The subject line of the email notification. |
| `body` | `String` | The message text of the email notification. |
| `ignoreNotifyOnOwnChangesSetting (optional)` | `Boolean` | If `false`, the message is not sent when changes are performed on behalf of the current user. Otherwise, the message is sent anyway. |
| `project (optional)` | `Project` | When set, the email address that is used as the 'From' address for the specified project is used to send the message. |

<a id="type-set"></a>
### Set

The `Set` object stores unique values of any type, whether primitive values or
object references. The Set is used as storage for all multi-value objects in
this API: custom fields that store multiple values, issue links, issues in a project, and so on.
You can access single values in the collection directly (see first(), last(), get(index)),
use an iterator (see entries(), values()), or traverse with forEach(visitor)
and find(predicate) methods.

The workflow API is based on ECMAScript 5.1.
This Set implementation mimics the functionality supported by the
[ES 6 Set interface](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set).

Type: `Object`  

#### Contents

##### Properties
- `size`
- `added`
- `removed`
- `isChanged`

##### Methods
- [`add`](#add)
- [`clear`](#clear)
- [`delete`](#delete)
- [`entries`](#entries)
- [`find`](#find)
- [`first`](#first)
- [`forEach`](#foreach)
- [`get`](#get)
- [`has`](#has)
- [`isEmpty`](#isempty)
- [`isNotEmpty`](#isnotempty)
- [`last`](#last)
- [`map`](#map)
- [`slice`](#slice)
- [`values`](#values)

#### Properties

| Name | Type | Description |
| --- | --- | --- |
| `size (optional)` | `number` | The number of elements in a Set. Use thoughtfully, as the calculation for large collections (like `project.issues`) may be resource consumptive. |
| `added (optional)` | `Set` | The elements that are added to a field that stores multiple values in the current transaction. Only relevant when the Set represents a multi-valued property (field) of a persistent entity. |
| `removed (optional)` | `Set` | The elements that are removed from a field that stores multiple values in the current transaction. Only relevant when the Set represents a multi-valued property (field) of a persistent entity. |
| `isChanged (optional)` | `boolean` | When the Set represents a multi-valued property (field) of a persistent entity and the field is changed in the current transaction, this property is `true`. |

#### Methods

##### add

Add an element to a Set. If the specified value is already present, a duplicate value is not added.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `element` | `Object` | The element to add to the Set. |

##### clear

Remove all of the values from a Set.

##### delete

Remove an element from a Set. If the specified element is not present, nothing happens.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `element` | `Object` | The element to remove from the Set. |

##### entries

Get an iterator for the entries in a Set. The same as `values()`.
Use an iterator when you need to traverse over entries until a specific condition
is met and modify the entries at the same time.

###### Returns

Return type: `Iterator.<Object>`.

An iterator for the collection of values.

###### Examples

```javascript
// We want to find first Critical among issue subtasks and assign it.
const checkAndAssign = function(task) {
  if (task.fields.Priority.name === ctx.Priority.Critical.name) {
    task.fields.Assignee = ctx.currentUser;
    return true;
  }
  return false;
};
const iter = issue.links['parent for'].entries();
let v = iter.next();
while (!v.done && !checkAndAssign(v.value)) {
  v = iter.next();
}
```

###### See Also
- If you need to modify all of the elements in the Set, see forEach(visitor).
- If you need to find an element that meets specific criteria, see find(predicate).

##### find

Find the first element in a Set for which a predicate function returns `true`.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `predicate` | `function` | A function with one argument that returns either true or false for a given value in the Set. |

###### Returns

Return type: `Object`.

The first value that returns `true` for the predicate function or undefined.

###### Examples

```javascript
issue.tags.find(function(tag) {
  return tag.name === 'release';
});
```

##### first

Find the first object in a collection based on the order in which the elements were added to the Set.

###### Returns

Return type: `Object`.

The first object in a collection or null if the collection is empty.

##### forEach

Apply a visitor function to each member of a collection.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `visitor` | `function` | The function to be applied to each member of the collection. |

###### Examples

```javascript
issue.links['parent for'].forEach(function(child) {
  child.fields.Priority = issue.fields.Priority;
});
```

##### get

Find an element with a specific index position in a Set.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `index` | `number` | The ordinal index of the element to be returned from the Set. |

###### Returns

Return type: `Object`.

An object at index position in a Set, or null
if the Set contains fewer than (index + 1) elements.

##### has

Checks a Set object to determine whether the specified element is present in the collection or not.

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `element` | `Object` | The element to locate in the Set. |

###### Returns

Return type: `boolean`.

If the element is found, returns `true`, otherwise, `false`.

##### isEmpty

Checks a Set object to determine whether it is empty.

###### Returns

Return type: `boolean`.

If the Set is empty, returns `true`, otherwise, `false`.

##### isNotEmpty

Checks a Set object to determine whether it is not empty.

###### Returns

Return type: `boolean`.

If the Set is not empty, returns `true`, otherwise, `false`.

##### last

Find the last object in a collection based on the order in which the elements were added to the Set.

###### Returns

Return type: `Object`.

The last object in a collection or null if collection is empty.

##### map

Transform each element in a Set and return the results as an array.

Since: `2025.3`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `visitor` | `function` | A function called for each value with arguments `(value, index, set)`. |

###### Returns

Return type: `Array.<*>`.

An array with the results of calling `visitor` on each element in insertion order.

###### Examples

```javascript
// Collect logins of all permitted users
const logins = issue.permittedUsers.map((u) => u.login);
```

##### slice

Create a shallow copy of a portion of a Set as an array.

Since: `2025.3`  

###### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `start (optional) = `0`` | `number` | Zero-based index at which to begin extraction. Negative values are treated as 0. |
| `end (optional)` | `number` | Zero-based index before which to end extraction. If omitted, extracts through the end. |

###### Returns

Return type: `Array.<Object>`.

An array containing the extracted values in insertion order. Returns an empty array when the range is empty.

###### Examples

```javascript
// Get first 3 subtasks
const firstThree = issue.links['parent for'].slice(0, 3);
```

##### values

Get an iterator for the entries in a Set. The same as `entries()`.

###### Returns

Return type: `Iterator.<Object>`.

An iterator for the collection of values.

###### See Also
- For details, see entries().

<a id="type-userattributes"></a>
### UserAttributes

Represents the collection of custom attributes that have been added to user profiles. To retrieve a value that is stored in the profile for a referenced user, use the attribute name as the key.
The entire object is read-only.

Type: `Object`  

#### Examples

```javascript
issue.fields.addComment('To contact me outside of normal office hours, call ' + ctx.currentUser.attributes['phone']);
```

<a id="type-workitemattributes"></a>
### WorkItemAttributes

Represents the collection of custom attributes that have been declared for work items on a project level. To retrieve a value that is stored in an attribute for a referenced work item, use the attribute name as the key.

Type: `Object`  

#### Examples

```javascript
issue.workItems.first().attributes['Attribute name'] = 'Attribute value';
```

```javascript
const attributeValue = issue.project.findWorkItemAttributeByName('Attrib').findValueByName('Value 3');
const newWorkItem = issue.addWorkItem({
  description: 'Hard work',
  date: Date.now(),
  author: ctx.currentUser,
  duration: 60,
  type: entities.WorkItemType.findByProject(issue.project).first()
});
newWorkItem.attributes.Attrib = attributeValue;
```
