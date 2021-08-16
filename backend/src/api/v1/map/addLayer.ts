import { nanoid } from 'nanoid';
import { events } from '../../../app';
import { Method } from '../../../lib/Method';
import { MethodError } from '../../../lib/MethodError';
import { Layer } from '../../../models/Layer';
import { User, UserRole } from '../../../models/User';

interface MethodBody {
    token: string;
    name: string;
    description: string;
    geometry: string;
}

interface MethodResponse {
    id: string;
    name: string;
    description: string;
    geometry: string;
}

export default new Method<MethodBody, MethodResponse>(
    ({ token, name, description, geometry }) => new Promise(async (ok, err) => {
        if ([token, name, description, geometry].filter(i => typeof i != 'string').length > 0) return err(new MethodError(400, 'BadRequest'));

        let user = await User.findOne({ token });
        if (!user) return err(new MethodError(403, 'BadCredentials'));
        if (user.role != UserRole.Admin) return err(new MethodError(403, 'BadCredentials'));
        try {
            let id = nanoid();
            let layer = new Layer({
                properties: {
                    id: id,
                    name,
                    description
                },
                geometry: JSON.parse(geometry)
            });
            await layer.save();
            events.emit('addLayer', { id, name, description, geometry });
            return ok({ id, name, description, geometry });
        } catch (e) {
            return err(new MethodError(500, 'InternalError'));
        }
    })
);