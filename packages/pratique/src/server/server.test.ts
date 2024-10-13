import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Server } from "./server";
import type { Handler, Middleware } from "../types";

describe("Server", () => {
	let server: Server;

	beforeEach(() => {
		server = new Server();
	});

	test("constructor initializes handlers for all HTTP methods", () => {
		expect(server["handlers"].get("GET")).toBeDefined();
		expect(server["handlers"].get("POST")).toBeDefined();
		expect(server["handlers"].get("PUT")).toBeDefined();
		expect(server["handlers"].get("PATCH")).toBeDefined();
		expect(server["handlers"].get("DELETE")).toBeDefined();
	});

	test("get method adds a GET handler", () => {
		const handler: Handler<"/test"> = () => new Response("Test");
		server.get("/test", handler);
		expect(server["handlers"].get("GET")?.get("/test")).toBeDefined();
	});

	test("post method adds a POST handler", () => {
		const handler: Handler<"/test"> = () => new Response("Test");
		server.post("/test", handler);
		expect(server["handlers"].get("POST")?.get("/test")).toBeDefined();
	});

	test("put method adds a PUT handler", () => {
		const handler: Handler<"/test"> = () => new Response("Test");
		server.put("/test", handler);
		expect(server["handlers"].get("PUT")?.get("/test")).toBeDefined();
	});

	test("patch method adds a PATCH handler", () => {
		const handler: Handler<"/test"> = () => new Response("Test");
		server.patch("/test", handler);
		expect(server["handlers"].get("PATCH")?.get("/test")).toBeDefined();
	});

	test("delete method adds a DELETE handler", () => {
		const handler: Handler<"/test"> = () => new Response("Test");
		server.delete("/test", handler);
		expect(server["handlers"].get("DELETE")?.get("/test")).toBeDefined();
	});

	test("use method adds middleware", () => {
		const middleware: Middleware<string> = () => {};
		server.use(middleware);
		expect(server["middlewares"]).toContain(middleware);
	});

	test("addHandler throws error when no handler is provided", () => {
		expect(() => {
			// @ts-ignore: Intentionally calling with no handlers for testing
			server["addHandler"]("GET", "/test");
		}).toThrow("At least one handler is required");
	});

	test("addHandler adds middleware and final handler", () => {
		const middleware: Middleware<"/test"> = () => {};
		const handler: Handler<"/test"> = () => new Response("Test");
		server["addHandler"]("GET", "/test", middleware, handler);

		const addedHandler = server["handlers"].get("GET")?.get("/test");
		expect(addedHandler).toBeDefined();
	});

	test("handleRequest returns correct response for existing route", async () => {
		const handler: Handler<"/test"> = () => new Response("Test Response");
		server.get("/test", handler);

		const request = new Request("http://localhost:3000/test");
		const response = await server["handleRequest"](request);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("Test Response");
	});

	test("handleRequest returns 404 for non-existent route", async () => {
		const request = new Request("http://localhost:3000/non-existent");
		const response = await server["handleRequest"](request);

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Not found");
	});

	test("handleRequest returns 405 for unsupported method", async () => {
		const request = new Request("http://localhost:3000/test", {
			method: "OPTIONS",
		});
		const response = await server["handleRequest"](request);

		expect(response.status).toBe(405);
		expect(await response.text()).toBe("Method not allowed");
	});

	test("handleRequest executes middleware before handler", async () => {
		const executionOrder: string[] = [];
		const middleware: Middleware<"/test"> = () => {
			executionOrder.push("middleware");
		};
		const handler: Handler<"/test"> = () => {
			executionOrder.push("handler");
			return new Response("Test");
		};

		server.get("/test", middleware, handler);

		const request = new Request("http://localhost:3000/test");
		await server["handleRequest"](request);

		expect(executionOrder).toEqual(["middleware", "handler"]);
	});

	test("handleRequest passes context to handler", async () => {
		let passedContext: any;
		const handler: Handler<"/test/:id"> = (context) => {
			passedContext = context;
			return new Response("Test");
		};

		server.get("/test/:id", handler);

		const request = new Request("http://localhost:3000/test/123?query=value");
		await server["handleRequest"](request);

		expect(passedContext).toBeDefined();
		expect(passedContext.request).toBeDefined();
		expect(passedContext.params).toEqual({ id: "123" });
		expect(passedContext.queryParams.get("query")).toBe("value");
	});

	test("start method calls Bun.serve with correct options", () => {
		const serveMock = mock(() => ({ stop: () => {} }));
		const originalServe = Bun.serve;
		// @ts-ignore: Bun's type definitions might not include this yet
		Bun.serve = serveMock;

		server.start({ port: 3000 });

		expect(serveMock).toHaveBeenCalledWith(
			expect.objectContaining({
				port: 3000,
				fetch: expect.any(Function),
			}),
		);

		// @ts-ignore: Restoring the original Bun.serve
		Bun.serve = originalServe;
	});
});
