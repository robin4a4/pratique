import { Server } from "pratique";

const server = new Server();

server.get("/", (req) => new Response("Hello, root!"));

server.get("/hello", (req) => new Response("Hello, hello!"));

server.get("/:name", (req) => {
    const name = req.url.split("/")[1];
    return new Response(`Hello, ${name}!`);
});

server.get("/:id", (req) => {
    const name = req.url.split("/")[1];
    return new Response(`Hello, ${name}!`);
});

server.start({ port: 3000 });
