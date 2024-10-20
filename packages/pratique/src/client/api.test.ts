import { describe, expect, test, mock } from "bun:test";
import { createApi } from "./api";

// Mock the global fetch function
global.fetch = mock((url: string, options: RequestInit) => {
  if (url === "localhost:3000" && options.method === "GET") {
    return Promise.resolve({
      status: 200,
      ok: true,
        json: () => Promise.resolve({ message: "Welcome to the API" }),
    });
  } else if (url === "localhost:3000/123" && options.method === "GET") {
    return Promise.resolve({
      status: 200,
      ok: true,
        json: () => Promise.resolve({ message: "Welcome to the API :id" }),
    });
  } else if (url === "localhost:3000/transformers" && options.method === "GET") {
    return Promise.resolve({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ message: "Welcome to the transformers API" }),
    });
  } else if (url === "localhost:3000/robot/123" && options.method === "GET") {
    return Promise.resolve({
      status: 201,
      ok: true,
      json: () => Promise.resolve({ id: 123, name: "optimus prime", from: "transformers" }),
    });
  } else if (url === "localhost:3000/robot/123" && options.method === "POST") {
    return Promise.resolve({
      status: 201,
      ok: true,
      json: () => Promise.resolve({ id: 123, name: "optimus prime", from: "transformers" }),
    });
  } else if (url === "localhost:3000/super/robot/1234" && options.method === "POST") {
    return Promise.resolve({
      status: 201,
      ok: true,
      json: () => Promise.resolve({ id: 1234, name: "megatron", from: "transformers" }),
    });
  }
  return Promise.reject(new Error("Not found"));
});

describe("createApi", () => {
  const api = createApi<any>("localhost:3000");

  test("GET request to root path", async () => {
    const { status, ok, json } = await api.index.get();

    expect(status).toBe(200);
    expect(ok).toBe(true);

    const data = await json();
    expect(data).toEqual({ message: "Welcome to the API" });
  });

  test("GET request to root path with path parameter", async () => {
    const { status, ok, json } = await api.index({ id: 123 }).get();

    expect(status).toBe(200);
    expect(ok).toBe(true);

    const data = await json();
    expect(data).toEqual({ message: "Welcome to the API :id" });
  });

  test("GET request to transformers path", async () => {
    const { status, ok, json } = await api.transformers.get();

    expect(status).toBe(200);
    expect(ok).toBe(true);

    const data = await json();
    expect(data).toEqual({ message: "Welcome to the transformers API" });
  });

  test("GET request with path parameter", async () => {
    const { status, ok, json } = await api.robot({ id: 123 }).get();

    expect(status).toBe(201);
    expect(ok).toBe(true);

    const data = await json();
    expect(data).toEqual({ id: 123, name: "optimus prime", from: "transformers" });
  });

  test("POST request with path parameter", async () => {
    const { status, ok, json } = await api.robot({ id: 123 }).post({
      name: "optimus prime",
      from: "transformers",
    });

    expect(status).toBe(201);
    expect(ok).toBe(true);

    const data = await json();
    expect(data).toEqual({ id: 123, name: "optimus prime", from: "transformers" });
  });

  test("POST request with path parameter", async () => {
    const { status, ok, json } = await api.super.robot({ id: 1234 }).post({
      name: "megatron",
      from: "transformers",
    });
    expect(status).toBe(201);
    expect(ok).toBe(true);

    const data = await json();
    expect(data).toEqual({ id: 1234, name: "megatron", from: "transformers" });
  });
});
