import { events } from '../../../app';
import { Method } from '../../../lib/Method';
import { MethodError } from '../../../lib/MethodError';
import { Layer } from '../../../models/Layer';
import { User, UserRole } from '../../../models/User';

interface MethodBody {
    token: string;
    id: string;
}

interface MethodResponse {
    timestamp: number;
}

export default new Method<MethodBody, MethodResponse>(
    ({ token, id }) => new Promise(async (ok, err) => {
        if ([token, id].filter(i => typeof i != 'string').length > 0) return err(new MethodError(400, 'BadRequest'));

        let user = await User.findOne({ token });
        if (!user) return err(new MethodError(403, 'BadCredentials'));
        if (user.role != UserRole.Admin) return err(new MethodError(403, 'BadCredentials'));
        try {
            let layer = await Layer.findOne({ 'properties.id': id });
            if (!layer) return err(new MethodError(400, 'LayerNotExist'));
            layer.delete();
            events.emit('removeLayer', { id });
            return ok({ timestamp: Date.now() });
        } catch (e) {
            return err(new MethodError(500, 'InternalError'));
        }
    })
);