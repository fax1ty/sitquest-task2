import axios from 'axios';
import { UserRole } from './pages/Home';

const ENDPOINT = process.env.REACT_APP_BACKEND_ENDPOINT;

async function call<T>(path: string, data: any, _: T, method: 'get' | 'post' = 'post') {
    const response = await axios[method](`${ENDPOINT}/${path}`, data, { headers: { 'Content-Type': 'application/json', 'Accept': '*/*' } });
    if (response.status !== 200) throw new Error(response.statusText);
    return response.data as T;
}

const api = {
    users: {
        login: (tokenOrEmail: string, password?: string) => call('users/login', typeof password === 'string' ? { email: tokenOrEmail, password } : { token: tokenOrEmail }, { token: '', name: '', email: '', role: UserRole.UNKNOWN })
    },
    map: {
        getMarkers: () => call('map/getMarkers', {}, { items: new Array<{ name: string; coordinates: [number, number], url: string; reviewed: boolean; }>() }, 'get'),
        addMarker: (token: string, name: string, url: string, coordinates: Array<number>) => call('map/addMarker', { token, name, url, coordinates }, { name, url, coordinates }, 'post'),
        reviewMarker: (token: string, coordinates: Array<number>, status: boolean) => call('map/reviewMarker', { token, coordinates, status }, { status }, 'post'),
        removeMarker: (token: string, coordinates: Array<number>) => call('map/removeMarker', { token, coordinates }, { timestamp: 0 }, 'post'),
        getLayers: () => call('map/getLayers', {}, { type: '', features: new Array<{ type: 'Feature', properties: { id: string; name: string; description: string; }, geometry: { type: string; coordinates: any; } }>() }, 'get'),
        addLayer: (token: string, name: string, description: string, geometry: string) => call('map/addLayer', { token, name, description, geometry }, { id: '', name, description, geometry }, 'post'),
        updateLayer: (token: string, id: string, name: string, description: string, geometry: string) => call('map/updateLayer', { token, id, name, description, geometry }, { id, name, description, geometry }, 'post'),
        removeLayer: (token: string, id: string) => call('map/removeLayer', { token, id }, { timestamp: 0 }, 'post')
    }
}

export default api;