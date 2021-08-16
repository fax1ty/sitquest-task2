import { model, Schema } from 'mongoose';

export interface IMarker {
    name: string;
    url: string;
    coordinates: Array<number>;
    owner: string;
    reviewed: boolean;
}

export const Marker = model<IMarker>('Marker',
    new Schema({
        name: String,
        url: String,
        coordinates: [Number],
        owner: String,
        reviewed: Boolean
    })
);