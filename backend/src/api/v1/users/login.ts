import { nanoid } from 'nanoid';
import { Method } from '../../../lib/Method';
import { MethodError } from '../../../lib/MethodError';
import { User, UserRole } from '../../../models/User';
import { pbkdf2 } from 'crypto';

interface MethodBody {
    email?: string;
    token?: string;
    password?: string;
}

interface MethodResponse {
    token: string;
    name: string;
    email: string;
    role: UserRole;
}

export default new Method<MethodBody, MethodResponse>(
    ({ email, token, password }) => new Promise(async (ok, err) => {
        if (typeof token != 'string' && typeof email != 'string') return err(new MethodError(400, 'BadRequest'));

        // if (!token && !email && !password) return err(new MethodError(400, 'BadRequest'));
        // if (email && !password) return err(new MethodError(400, 'BadRequest'));
        // if (email && (typeof email != 'string' || typeof password != 'string')) return err(new MethodError(400, 'BadRequest'));
        // if (!email && typeof token != 'string') return err(new MethodError(400, 'BadRequest'));

        let user = token ? await User.findOne({ token: token }) : await User.findOne({ email });
        if (!user) return err(new MethodError(403, 'BadCredentials'));
        if (token && user) {
            try {
                let token = nanoid();
                user.token = token;
                user.lastSeen = Date.now();
                await user.save();
                return ok({ token, name: user.name, email: user.email, role: user.role });
            } catch (e) {
                return err(new MethodError(500, 'InternalError'));
            }
        }
        pbkdf2(password, process.env.SALT, 1, 32, 'sha512', async (e, salted) => {
            if (e) return err(new MethodError(500, 'InternalError'));
            if (salted.toString('hex') !== user.password) return err(new MethodError(403, 'BadCredentials'));
            try {
                let token = nanoid();
                user.token = token;
                user.lastSeen = Date.now();
                await user.save();
                return ok({ token, name: user.name, email: user.email, role: user.role });
            } catch (e) {
                return err(new MethodError(500, 'InternalError'));
            }
        });
    })
);