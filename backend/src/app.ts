import fs from 'fs';
import { Method } from './lib/Method';
import fastify from 'fastify';
import { MethodError } from './lib/MethodError';
const server = fastify();
import fastifyMultipart from 'fastify-multipart';
import fastifyCors from 'fastify-cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import chalk from 'chalk';
import WebSocket from 'ws';
import mitt from 'mitt';
import { User, UserOnlineStatus } from './models/User';
import fastifyStatic from 'fastify-static';
import path from 'path';

type UserSocket = WebSocket & { email: string; }

export enum ActivityId {
    UNKNOWN = 0,

    // Get
    AUTH = 1,

    // Send
    NEW_MARKER = 101,
    REMOVE_MARKER = 102,
    NEW_LAYER = 105,
    REMOVE_LAYER = 106,
    EDIT_LAYER = 107
}

dotenv.config();

export const events = mitt();

mongoose.connect(process.env.MONGODB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
})
    .then(() => {
        console.log(chalk.green`[INFO] Successfully connected to a MongoDB instance with the connection string`);
        server.listen(process.env.PORT || 3000, process.env.IP || 'localhost')
            .then(address => {
                console.log(chalk.green`[INFO] HTTP server is up and ready on ${address}`);

                let sockets = new Set<UserSocket>();

                events.on('addMarker', ({ name, url, lat, lng, owner }) => {
                    Array.from(sockets.values()).filter(s => s.email != owner).forEach(s => s.send(`${ActivityId.NEW_MARKER}|${name}|${url}|${lat}|${lng}`));
                });
                events.on('removeMarker', ({ lat, lng }) => {
                    Array.from(sockets.values()).forEach(s => s.send(`${ActivityId.REMOVE_MARKER}|${lat}|${lng}`));
                });
                events.on('addLayer', ({ id, name, description, geometry }) => {
                    Array.from(sockets.values()).forEach(s => s.send(`${ActivityId.NEW_LAYER}|${id}|${name}|${description}|${geometry}`));
                });
                events.on('editLayer', ({ id, name, description, geometry }) => {
                    Array.from(sockets.values()).forEach(s => s.send(`${ActivityId.EDIT_LAYER}|${id}|${name}|${description}|${geometry}`));
                });
                events.on('removeLayer', ({ id }) => {
                    Array.from(sockets.values()).forEach(s => s.send(`${ActivityId.REMOVE_LAYER}|${id}`));
                });

                let wss = new WebSocket.Server({ server: server.server });
                console.log(chalk.green`[INFO] WS server is up and ready on ${address.replace('http', 'ws')}`);
                wss.on('connection', (socket: UserSocket) => {
                    sockets.add(socket);
                    socket.on('message', async (message: Buffer) => {
                        let string = message.toString('utf-8');
                        let args = string.split('|');
                        let activity = parseInt(args[0]);
                        if (!activity) return;
                        if (activity == ActivityId.AUTH) {
                            if (!args[1]) return;
                            let user = await User.findOne({ token: args[1] });
                            if (!user) return;
                            socket.email = user.email;
                            user.lastSeen = Date.now();
                            user.status = UserOnlineStatus.Online;
                            await user.save();
                        }
                    });
                    socket.on('close', async () => {
                        if (socket.email) {
                            let user = await User.findOne({ email: socket.email });
                            user.lastSeen = Date.now();
                            user.status = UserOnlineStatus.Offline;
                            await user.save();
                        }
                        sockets.delete(socket);
                    });
                });
            })
            .catch(err => {
                console.error(chalk.red`[ERROR] Server can't boot normally. Error: ${err}`);
                process.exit(1);
            });
    })
    .catch(e => {
        console.error(chalk.red`[ERROR] Error connecting to a MongoDB instance. Error: ${e}`);
        process.exit(1);
    });

server.register(fastifyMultipart, {
    limits: {
        fieldNameSize: 100,
        fieldSize: 100,
        fields: 0,
        fileSize: 5 * 1024 * 1024,
        files: 1,
        headerPairs: 2000
    }
});
server.register(fastifyStatic, {
    root: path.resolve(__dirname, '../../frontend/build')
});
server.register(fastifyCors, {});

let api = fs.readdirSync(__dirname + '/api/', { withFileTypes: true });
let toRegister = api.map(v => {
    if (!v.isDirectory()) return;
    let version = fs.readdirSync(`${__dirname}/api/${v.name}/`, { withFileTypes: true });
    return version.map(g => {
        if (!g.isDirectory()) return;
        let group = fs.readdirSync(`${__dirname}/api/${v.name}/${g.name}`, { withFileTypes: true });
        return group.map(m => {
            if (m.isDirectory()) return;
            if (!m.name.includes('.js')) return;
            let method = require(`${__dirname}/api/${v.name}/${g.name}/${m.name}`).default as Method<any>;
            return { ...method, route: `/api/${v.name}/${g.name}/${m.name.replace('.js', '')}` };
        });
    });
}).reduce((a, b) => a.concat(b)).reduce((a, b) => a.concat(b));

toRegister.forEach(method => {
    console.log(chalk.blue`[INFO] Method ${method.route} was successfully registered`);
    server[method.method](method.route, async (req, res) => {
        method.callback(req.body, req)
            .then(data => res.send(data))
            .catch(({ code, message }: MethodError) => res.code(code).send(message));
    });
});