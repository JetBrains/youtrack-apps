import type {HostAPI} from '../../../@types/globals';
import type {Issue, DateFormats} from './components/issue-list/types/issue-types';
import type {Article} from './components/article-list/article-line/article-line';
import type {QueryAssistResponse} from '@jetbrains/ring-ui-built/components/query-assist/query-assist';

const PROJECT_CUSTOM_FIELD_FIELDS = 'id,bundle(id),field(id,name,localizedName,fieldType(id,valueType))';
const DATE_PRESENTATION_SETTINGS = 'dateFieldFormat(datePattern,pattern)';
const ISSUE_FIELD_VALUE_FIELDS =
    'id,name,localizedName,login,avatarUrl,name,presentation,minutes,color(id,foreground,background)';
const ISSUE_FIELD_FIELDS = `id,value(${ISSUE_FIELD_VALUE_FIELDS}),projectCustomField(${PROJECT_CUSTOM_FIELD_FIELDS})`;
const ISSUE_FIELDS = `id,idReadable,summary,resolved,fields(${ISSUE_FIELD_FIELDS})`;

const ARTICLE_FIELDS = `id,idReadable,summary`

const QUERY_ASSIST_FIELDS =
    'query,caret,styleRanges(start,length,style),suggestions(options,prefix,option,suffix,description,matchingStart,matchingEnd,caret,completionStart,completionEnd,group,icon)';

export const DOCUMENTS_PACK_SIZE = 6;
export const SINGLE_VIEW_PACK_SIZE = 7; // Compensates for the extra space when tabs are absent from UI

export const DEFAULT_DATE_FORMATS: DateFormats = {
  datePattern: 'd MMM yyyy',
  pattern: 'd MMM yyyy HH:mm',
};

export const getDocumentLink = (documentType: string, id: string) => {
    return `/${documentType}/${id}`;
};

export const getIssueLink = (id: string) => {
    return getDocumentLink('issue', id);
};
export const getArticleLink = (id: string) => {
    return getDocumentLink('articles', id);
};

export interface DocumentsCount {
    count: number;
}

export interface GeneralUserProfile {
    dateFieldFormat: DateFormats;
}

export default class API {
    constructor(private host: HostAPI) {}

    async loadIssues(query: string, skip: number, packSize: number): Promise<Issue[]> {
        const encodedQuery = encodeURIComponent(query);
        return await this.host.fetchYouTrack(
            `issues?query=${encodedQuery}&fields=${ISSUE_FIELDS}&$top=${packSize}&$skip=${skip}`,
        );
    }

    async loadIssuesCount(query: string): Promise<number> {
        const response: DocumentsCount = await this.host.fetchYouTrack(`issuesGetter/count?fields=count`, {
            method: 'POST',
            body: {
                query,
            },
        });

        return response.count;
    }

    async loadArticles(query: string, skip: number, packSize: number): Promise<Article[]> {
        const encodedQuery = encodeURIComponent(query);
        return await this.host.fetchYouTrack(
            `articles?query=${encodedQuery}&fields=${ARTICLE_FIELDS}&$top=${packSize}&$skip=${skip}`,
        );
    }

    async loadArticlesCount(query: string): Promise<number> {
        const encodedQuery = encodeURIComponent(query);
        const response: Article[] = await this.host.fetchYouTrack(`articles?query=${encodedQuery}&fields=id,summary`);
        return response.length;
    }

    async underlineAndSuggest(query: string, caret: number): Promise<QueryAssistResponse> {
        return await this.host.fetchYouTrack(`search/assist?fields=${QUERY_ASSIST_FIELDS}`, {
            method: 'POST',
            body: {
                query,
                caret,
            },
        });
    }

    async loadDateFormats(): Promise<DateFormats> {
        const generalUserProfile: GeneralUserProfile = await this.host.fetchYouTrack(
            `users/me/profiles/general?fields=${DATE_PRESENTATION_SETTINGS}`,
        );
        const dateFormats = generalUserProfile?.dateFieldFormat ?? {};

        return {
            datePattern: dateFormats?.datePattern || DEFAULT_DATE_FORMATS.datePattern,
            pattern: dateFormats?.pattern || DEFAULT_DATE_FORMATS.pattern,
        };
    }
}
