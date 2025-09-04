import {i18n} from 'hub-dashboard-addons/dist/localization';

function getDefaultMessage() {
  return i18n('Oops! Something went wrong...');
}

function getMessage(hubResponseError, defaultErrorMessage) {
  if (typeof hubResponseError === 'string' && hubResponseError) {
    return hubResponseError;
  }
  const responseErrorData = getResponseData(hubResponseError);
  return responseErrorData.error_description ||
    responseErrorData.error_developer_message ||
    defaultErrorMessage || getDefaultMessage();

  function getResponseData(response) {
    return (response || {}).data || response || {};
  }
}

export default {
  getMessage,
  getDefaultMessage
};
