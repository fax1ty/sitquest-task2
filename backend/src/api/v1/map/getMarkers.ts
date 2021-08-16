import { Method } from '../../../lib/Method';
import { MethodError } from '../../../lib/MethodError';
import { IMarker, Marker } from '../../../models/Marker';

interface MethodBody {
}

interface MethodResponse {
    items: Array<IMarker>;
}

export default new Method<MethodBody, MethodResponse>(
    () => new Promise(async (ok, err) => {
        try {
            let markers = await Marker.find({}, { _id: 0, owner: 0 });
            ok({ items: markers });
        } catch (e) {
            return err(new MethodError(500, 'InternalError'));
        }
    }), 'get'
);