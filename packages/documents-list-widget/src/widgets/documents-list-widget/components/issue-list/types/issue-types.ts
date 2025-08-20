export interface Color {
    id: string;
    background: string;
    foreground: string;
}

export interface DateFormats {
    datePattern: string;
    dateTimePattern: string;
}

export interface FieldValue {
    id?: string;
    name?: string;
    localizedName?: string;
    presentation?: string;
    minutes?: number;
    login?: string;
    color?: Color;
    avatarUrl?: string;
}

export interface ProjectCustomField {
    id: string;
    field?: {
        id?: string;
        name?: string;
        localizedName?: string;
        fieldType?: {
            valueType: string;
        };
    };
    bundle?: undefined;
}

export interface IssueField {
    id: string;
    projectCustomField: ProjectCustomField;
    value: FieldValue | FieldValue[];
}

export interface Issue {
    id: string;
    idReadable: string;
    summary: string;
    resolved: number | null;
    fields: IssueField[];
}

export interface ColoredSquareModel {
    style: {
        background: string;
        color: string;
    };
    letter: string;
    title: string;
    issueField: IssueField;
}
