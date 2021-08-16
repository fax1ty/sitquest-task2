import { events } from '../../../app';
import { Method } from '../../../lib/Method';
import { MethodError } from '../../../lib/MethodError';
import { Layer } from '../../../models/Layer';
import { User, UserRole } from '../../../models/User';

interface MethodBody {
    token: string;
    id: string;
    name: string;
    description: string;
    geometry: string;
}

interface MethodResponse {
    name: string;
    description: string;
    geometry: string;
    id: string;
}

export default new Method<MethodBody, MethodResponse>(
    ({ token, name, description, geometry, id }) => new Promise(async (ok, err) => {
        if ([token, name, description, geometry, id].filter(i => typeof i != 'string').length > 0) return err(new MethodError(400, 'BadRequest'));

        let user = await User.findOne({ token });
        if (!user) return err(new MethodError(403, 'BadCredentials'));
        if (user.role != UserRole.Admin) return err(new MethodError(403, 'BadCredentials'));
        try {
            let layer = await Layer.findOne({ 'properties.id': id });
            if (!layer) return err(new MethodError(400, 'LayerNotExist'));
            layer.properties = { name, description, id }
            layer.geometry = JSON.parse(geometry);
            await layer.save();
            events.emit('editLayer', { id, name, description, geometry });
            return ok({ name, description, geometry, id });
        } catch (e) {
            console.error(e);
            return err(new MethodError(500, 'InternalError'));
        }
    })
);