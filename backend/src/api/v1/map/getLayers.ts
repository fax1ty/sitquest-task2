import { Method } from '../../../lib/Method';
import { MethodError } from '../../../lib/MethodError';
import { ILayer, Layer } from '../../../models/Layer';

interface MethodBody {
}

interface MethodResponse {
    type: 'FeatureCollection';
    features: Array<ILayer>;
}

export default new Method<MethodBody, MethodResponse>(
    () => new Promise(async (ok, err) => {
        try {
            let layers = await Layer.find({}, { _id: 0 });
            ok({ type: 'FeatureCollection', features: layers });
        } catch (e) {
            return err(new MethodError(500, 'InternalError'));
        }
    }), 'get'
);