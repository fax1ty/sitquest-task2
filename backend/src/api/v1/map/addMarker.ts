import { events } from '../../../app';
import { Method } from '../../../lib/Method';
import { MethodError } from '../../../lib/MethodError';
import { Marker } from '../../../models/Marker';
import { User } from '../../../models/User';

interface MethodBody {
    token: string;
    name: string;
    url: string;
    coordinates: Array<number>;
}

interface MethodResponse {
    name: string;
    url: string;
    coordinates: Array<number>;
}

export default new Method<MethodBody, MethodResponse>(
    ({ token, name, url, coordinates }) => new Promise(async (ok, err) => {
        if ([token, name, url].filter(i => typeof i != 'string').length > 0) return err(new MethodError(400, 'BadRequest'));
        if (!Array.isArray(coordinates)) return err(new MethodError(400, 'BadRequest'));
        if (coordinates.length < 2) return err(new MethodError(400, 'BadRequest'));
        if (typeof coordinates[0] != 'number' || typeof coordinates[1] != 'number') return err(new MethodError(400, 'BadRequest'));

        let user = await User.findOne({ token });
        if (!user) return err(new MethodError(403, 'BadCredentials'));
        try {
            let marker = new Marker({ name, url, coordinates, owner: user.email });
            await marker.save();
            events.emit('addMarker', { name, url, lat: coordinates[0], lng: coordinates[1], owner: user.email, reviewed: false });
            return ok({ name, url, coordinates });
        } catch (e) {
            return err(new MethodError(500, 'InternalError'));
        }
    })
);