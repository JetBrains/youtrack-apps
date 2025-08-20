import {createContext, useContext} from 'react';
import API from './api'
import {EmbeddableWidgetAPI} from '../../../@types/globals';

export interface WidgetInterface {
    api: API;
    appsApi: EmbeddableWidgetAPI
}

const WidgetContext = createContext<WidgetInterface | null>(null);

export function useWidgetContext() {
    const context = useContext(WidgetContext);

    if (!context) {
        throw new Error('useWidgetContext must be used within a WidgetContextProvider');
    }

    return context;
}

export default WidgetContext;
