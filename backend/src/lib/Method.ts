import { FastifyRequest } from 'fastify';

type HTTPMethods = 'get' | 'post';

export class Method<T, K = any> {
    constructor(public callback: (body: T, req: FastifyRequest) => Promise<K>, public method: HTTPMethods = 'post') {

    }
}