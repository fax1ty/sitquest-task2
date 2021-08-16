import { pbkdf2 } from 'crypto';
import { nanoid } from 'nanoid';
import { Method } from '../../../lib/Method';
import { MethodError } from '../../../lib/MethodError';
import { User, UserOnlineStatus, UserRole } from '../../../models/User';

interface MethodBody {
    password: string;
    name: string;
    email: string;
}

interface MethodResponse {
    token: string;
    name: string;
    email: string;
}

export default new Method<MethodBody, MethodResponse>(
    ({ password, name, email }) => new Promise(async (ok, err) => {
        if ([password, name, email].filter(i => typeof i != 'string').length > 0) return err(new MethodError(400, 'BadRequest'));

        let user = await User.findOne({ email });
        if (user) return err(new MethodError(500, 'UserAlreadyExist'));
        pbkdf2(password, process.env.SALT, 1, 32, 'sha512', async (e, salted) => {
            if (e) return err(new MethodError(500, 'InternalError'));
            let token = nanoid();
            let user = new User({ email, password: salted.toString('hex'), token, name, role: UserRole.User, lastSeen: Date.now(), status: UserOnlineStatus.Unknown });
            try {
                await user.save();
                return ok({ token, name, email });
            } catch (e) {
                return err(new MethodError(500, 'InternalError'));
            }
        });
    })
);