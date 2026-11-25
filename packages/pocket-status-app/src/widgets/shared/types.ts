export interface WidgetConfiguration {
  isConfigured: boolean;
  key?: string;
  name?: string;
  backgroundColor?: string;
  textColor?: string;
  // The user whose personal set holds the status; not set for a project set
  setOwner?: string;
  // Set when the widget tracks a field of an issue instead of a status from a set
  issueId?: string;
  // The tracked field; without it the widget tracks the State field
  fieldName?: string;
}

export interface StatusValue {
  name: string;
  color: string;
  textColor: string;
}

export interface StatesSet {
  name: string;
  values: StatusValue[];
}
