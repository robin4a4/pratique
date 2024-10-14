import { match } from "../router/match";
import type { Handler, Middleware, ServerOptions } from "../types";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class Server {
	private handlers: Map<HttpMethod, Map<string, Handler<string>>> = new Map();
	private middlewares: Middleware<string>[] = [];
	constructor() {
		this.handlers.set("GET", new Map());
		this.handlers.set("POST", new Map());
		this.handlers.set("PUT", new Map());
		this.handlers.set("PATCH", new Map());
		this.handlers.set("DELETE", new Map());
	}

	private addHandler<TPath extends string>(
		method: HttpMethod,
		path: TPath,
		...handlers: [...Middleware<TPath>[], Handler<TPath>]
	) {
		const finalHandler = handlers.pop() as Handler<TPath>;
		if (!finalHandler) throw new Error("At least one handler is required");

		this.handlers.get(method)?.set(path, (context) => {
			for (const middleware of handlers) {
				middleware(context);
			}
			return finalHandler(context);
		});
	}

	get<TPath extends string>(
		path: TPath,
		...handlers: [...Middleware<TPath>[], Handler<TPath>]
	) {
		this.addHandler("GET", path, ...handlers);
	}

	post<TPath extends string>(
		path: TPath,
		...handlers: [...Middleware<TPath>[], Handler<TPath>]
	) {
		this.addHandler("POST", path, ...handlers);
	}

	put<TPath extends string>(
		path: TPath,
		...handlers: [...Middleware<TPath>[], Handler<TPath>]
	) {
		this.addHandler("PUT", path, ...handlers);
	}

	patch<TPath extends string>(
		path: TPath,
		...handlers: [...Middleware<TPath>[], Handler<TPath>]
	) {
		this.addHandler("PATCH", path, ...handlers);
	}

	delete<TPath extends string>(
		path: TPath,
		...handlers: [...Middleware<TPath>[], Handler<TPath>]
	) {
		this.addHandler("DELETE", path, ...handlers);
	}

	use(middleware: Middleware<string>) {
		this.middlewares.push(middleware);
	}

	private applyMiddlewares(req: Request) {
		for (const middleware of this.middlewares) {
			middleware({
				request: req,
				searchParams: new URLSearchParams(req.url.split("?")[1]),
			});
		}
	}

	private handleRequest(req: Request): Response {
		const pathWithDomain = req.url.split("?")[0];
		const path = pathWithDomain.replace("http://localhost:3000", "");
		const method = req.method as HttpMethod;

		console.log(method, path);

		const methodHandlers = this.handlers.get(method);
		if (!methodHandlers) {
			return new Response("Method not allowed", { status: 405 });
		}

		const allStoredPaths = Array.from(methodHandlers.keys());
		const pathMatch = match(path, allStoredPaths);

		if (pathMatch && methodHandlers.has(pathMatch.path)) {
			const context = {
				request: req,
				params: Object.fromEntries(
					pathMatch.params.map((param) => [param.name, param.value]),
				),
				searchParams: new URLSearchParams(req.url.split("?")[1]),
			};

			const handler = methodHandlers.get(pathMatch.path);
			if (handler) {
				return handler(context);
			}
		}

		return new Response("Not found", { status: 404, statusText: "Not Found" });
	}

	start({ port }: ServerOptions) {
		Bun.serve({
			port: port ?? 3000,
			fetch: (req) => {
				if (this.middlewares.length > 0) {
					this.applyMiddlewares(req);
				}
				const context = this.handleRequest(req);
				return context;
			},
		});
	}
}
