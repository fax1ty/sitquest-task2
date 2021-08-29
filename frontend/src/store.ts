// TODO: структурировать код в компоненты, сделать их observer'ами

import { makeAutoObservable } from "mobx";
import { User } from "./pages/Home";

interface Marker {
    id: string;
    name: string;
    coordinates: Array<number>;
    url: string;
    reviewed: boolean;
    virtual?: boolean;
}

interface Layer {
    type: "Feature";
    properties: {
        id: string;
        name: string;
        description: string;
    };
    geometry: {
        type: string;
        coordinates: Array<any>;
    };
}

class Store {
    constructor() {
        makeAutoObservable(this);
    }

    token = "";
    setToken(token: string) {
        this.token = token;
    }

    user: User = {
        name: "",
        email: "",
        role: 0,
        photo: "",
        token: "",
    };
    setUser(user: User) {
        this.user = user;
    }
    updateUserToken(token: string) {
        let user = { ...this.user };
        user.token = token;
        this.setUser(user);
    }

    markers = new Array<Marker>();
    setMarkers(markers: Array<Marker>) {
        this.markers = markers;
    }
    addMarker(marker: Marker) {
        let markers = [...this.markers];
        markers.push(marker);
        this.setMarkers(markers);
    }
    removeMarker(id: string) {
        let markers = [...this.markers];
        this.setMarkers(markers.filter((m) => m.id !== id));
    }
    updateMarker(marker: Marker) {
        let markers = [...this.markers];
        let i = markers.findIndex((m) => m.id === marker.id);
        markers[i] = marker;
        this.setMarkers(markers);
    }
    removeVirtualMarkers() {
        let markers = [...this.markers];
        this.setMarkers(markers.filter((m) => !m.virtual));
    }
    get soretedMarkers() {
        let markers = [...this.markers];
        return markers.sort((a, b) => {
            if (a.reviewed && !b.reviewed) return 1;
            if (b.reviewed && !a.reviewed) return -1;
            return 0;
        });
    }

    layers = { type: "FeatureCollection", features: new Array<Layer>() };
    setLayers(layers: Array<Layer>) {
        this.layers = { type: "FeatureCollection", features: layers };
    }
    addLayer(layer: Layer) {
        let layers = [...this.layers.features];
        layers.push(layer);
        this.setLayers(layers);
    }
    removeLayer(id: string) {
        let layers = [...this.layers.features];
        this.setLayers(layers.filter((l) => l.properties.id !== id));
    }
    updateLayer(layer: Layer) {
        let layers = [...this.layers.features];
        let i = layers.findIndex(
            (l) => l.properties.id === layer.properties.id
        );
        layers[i] = layer;
        this.setLayers(layers);
    }

    googleTestPassed = false;
    setGoogleTestPassed(passed: boolean) {
        this.googleTestPassed = passed;
    }

    sideViewAdminPage = "";
    setSideViewAdminPage(adminPage: string) {
        this.sideViewAdminPage = adminPage;
    }
    sideViewAdminSelectedMarker: Marker | null = null;
    setSideViewAdminSelectedMarker(marker: Marker) {
        this.sideViewAdminSelectedMarker = marker;
    }
}

export default new Store();
