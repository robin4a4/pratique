import { match } from "./router/match";
import type { Context, Handler, ServerOptions } from "./types";

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class Server {
    private handlers: Map<HttpMethod, Map<string, Handler<string>>> = new Map();

    constructor() {
        this.handlers.set('GET', new Map());
        this.handlers.set('POST', new Map());
        this.handlers.set('PUT', new Map());
        this.handlers.set('DELETE', new Map());
    }

    private addHandler<TPath extends string>(method: HttpMethod, path: TPath, handler: Handler<TPath>) {
        this.handlers.get(method)?.set(path, handler);
    }

    get<TPath extends string>(path: TPath, handler: Handler<TPath>) {
        this.addHandler('GET', path, handler);
    }

    post<TPath extends string>(path: TPath, handler: Handler<TPath>) {
        this.addHandler('POST', path, handler);
    }

    put<TPath extends string>(path: TPath, handler: Handler<TPath>) {
        this.addHandler('PUT', path, handler);
    }

    delete<TPath extends string>(path: TPath, handler: Handler<TPath>) {
        this.addHandler('DELETE', path, handler);
    }

    start({ port }: ServerOptions) {
        Bun.serve({
            port: port ?? 3000,
            fetch: (req) => this.handleRequest(req),
        });
    }

    private handleRequest(req: Request): Response {
        const pathWithDomain = req.url.split('?')[0];
        const path = pathWithDomain.replace('http://localhost:3000', '');
        const method = req.method as HttpMethod;

        console.log(method, path);

        const methodHandlers = this.handlers.get(method);
        if (!methodHandlers) {
            return new Response('Method not allowed', { status: 405 });
        }

        const allStoredPaths = Array.from(methodHandlers.keys());
        const pathMatch = match(path, allStoredPaths);

        if (pathMatch && methodHandlers.has(pathMatch.path)) {
            const context = {
                request: req,
                params: Object.fromEntries(pathMatch.params.map(param => [param.name, param.value])),
                queryParams: new URLSearchParams(req.url.split('?')[1]),
            };

            const handler = methodHandlers.get(pathMatch.path);
            if (handler) {
                return handler(context);
            }
        }

        return new Response('Not found', { status: 404, statusText: 'Not Found' });
    }
}
