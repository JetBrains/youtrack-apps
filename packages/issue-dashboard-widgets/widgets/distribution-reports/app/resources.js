import BackendTypes
from '../../../../lib/reporting-components/backend-types/backend-types';

const REPORT_FILTER_FIELDS_FIELDS = 'id,name,presentation,localizedName,customField(fieldType(presentation))';

async function loadReportsFilterFields(fetchYouTrack, projects) {
  const fld = serializeArrayParameter('fld',
    (projects || []).map(project => project.id)
  );
  const types = serializeArrayParameter('fieldTypes', ['custom', 'predefined', 'board', 'link']);
  const params = [
    fld, '$top=300', `fields=${REPORT_FILTER_FIELDS_FIELDS}`, types
  ].filter(param => param.length > 0).join('&');

  return await fetchYouTrack(`api/filterFields?${params}`);
}

async function loadReportsAggregationFilterFields(fetchYouTrack, projects) {
  const fieldTypes = serializeArrayParameter(
    'fieldTypes', ['integer', 'float', 'period']
  );
  const fld = serializeArrayParameter('fld',
    (projects || []).map(project => project.id)
  );
  const params = [
    fieldTypes,
    fld,
    'includeNonFilterFields=true',
    '$top=300',
    `fields=${REPORT_FILTER_FIELDS_FIELDS}`
  ].filter(param => param.length > 0).join('&');

  const aggregationFilterFields = (await fetchYouTrack(`api/filterFields?${params}`)) || [];

  const configWithVotesPresentations = await fetchYouTrack('api/config?fields=l10n(predefinedQueries(votes))');
  const votersPresentation = configWithVotesPresentations &&
    configWithVotesPresentations.l10n &&
    configWithVotesPresentations.l10n.predefinedQueries &&
    configWithVotesPresentations.l10n.predefinedQueries.votes;

  if (votersPresentation) {
    return [{
      presentation: votersPresentation,
      id: votersPresentation,
      $type: BackendTypes.get().PredefinedFilterField
    }].concat(aggregationFilterFields);
  }
  return aggregationFilterFields;
}

function serializeArrayParameter(paramName, arr) {
  return encodeURI(
    arr.map(item => `${paramName}=${item}`).join('&')
  );
}

export {
  loadReportsFilterFields,
  loadReportsAggregationFilterFields
};
