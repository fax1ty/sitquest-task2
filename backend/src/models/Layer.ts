import { model, Schema } from 'mongoose';

export interface ILayer {
    properties: { name: string; description: string; id: string; }
    geometry: { type: string; coordinates: Array<any>; }
}

export const Layer = model<ILayer>('Layer',
    new Schema({
        properties: {
            name: String,
            description: String,
            id: String
        },
        geometry: {
            type: String,
            coordinates: []
        }
    }, { typeKey: '$type' })
);