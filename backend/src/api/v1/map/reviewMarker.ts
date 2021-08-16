import { Method } from '../../../lib/Method';
import { MethodError } from '../../../lib/MethodError';
import { Marker } from '../../../models/Marker';
import { User, UserRole } from '../../../models/User';

interface MethodBody {
    token: string;
    coordinates: Array<number>;
    status: boolean;
}

interface MethodResponse {
    status: boolean;
}

export default new Method<MethodBody, MethodResponse>(
    ({ token, coordinates, status }) => new Promise(async (ok, err) => {
        if (typeof token != 'string') return err(new MethodError(400, 'BadRequest'));
        if (!Array.isArray(coordinates)) return err(new MethodError(400, 'BadRequest'));
        if (coordinates.length < 2) return err(new MethodError(400, 'BadRequest'));
        if (typeof coordinates[0] != 'number' || typeof coordinates[1] != 'number') return err(new MethodError(400, 'BadRequest'));
        if (typeof status != 'boolean') return err(new MethodError(400, 'BadRequest'));

        let user = await User.findOne({ token });
        if (!user) return err(new MethodError(403, 'BadCredentials'));
        if (user.role != UserRole.Admin) return err(new MethodError(403, 'BadCredentials'));
        let marker = await Marker.findOne({ coordinates });
        if (!marker) return err(new MethodError(400, 'MarkerNotExist'));
        try {
            marker.reviewed = status;
            await marker.save();
            ok({ status });
        } catch (e) {
            return err(new MethodError(500, 'InternalError'));
        }
    })
);