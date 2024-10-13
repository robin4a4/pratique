import { describe, expect, test } from "bun:test";
import { match } from "./match";

describe("match function", () => {
	test("matches exact paths", () => {
		const result = match("/hello/world", ["/hello/world", "/foo/bar"]);
		expect(result).toEqual({
			path: "/hello/world",
			params: [],
		});
	});

	test("matches paths with parameters", () => {
		const result = match("/hello/john/doe", ["/hello/:firstName/:lastName"]);
		expect(result).toEqual({
			path: "/hello/:firstName/:lastName",
			params: [
				{ name: "firstName", value: "john" },
				{ name: "lastName", value: "doe" },
			],
		});
	});

	test("returns null for non-matching paths", () => {
		const result = match("/hello/world", ["/foo/bar", "/baz/qux"]);
		expect(result).toBeNull();
	});

	test("matches the last corresponding path", () => {
		const result = match("/api/users/123", [
			"/api/:previousResource/:id",
			"/api/:resource/:id",
		]);
		expect(result).toEqual({
			path: "/api/:resource/:id",
			params: [
				{ name: "resource", value: "users" },
				{ name: "id", value: "123" },
			],
		});
	});

	test("matches the path that is the most exact", () => {
		const result = match("/api/users/123", [
			"/api/users/:id",
			"/api/:resource/:id",
		]);
		expect(result).toEqual({
			path: "/api/users/:id",
			params: [{ name: "id", value: "123" }],
		});
	});

	test("handles root path", () => {
		const result = match("/", ["/", "/home"]);
		expect(result).toEqual({
			path: "/",
			params: [],
		});
	});

	test("handles paths with trailing slashes", () => {
		const result = match("/users/", ["/users", "/users/:id"]);
		expect(result).toEqual({
			path: "/users",
			params: [],
		});
	});
});
