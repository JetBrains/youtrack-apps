import {AppAPI, EmbeddableWidgetAPI} from '../../../@types/globals';

export const initHost = async (appApi?: AppAPI): Promise<EmbeddableWidgetAPI> => await YTApp.register(appApi) as EmbeddableWidgetAPI;
