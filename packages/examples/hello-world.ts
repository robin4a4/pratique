import { Server } from "pratique";

const server = new Server();

server.get("/", () => new Response("Hello, root!"));

server.get("/hello", () => new Response("Hello, hello!"));

server.get("/:name", ({params}) => {
    return new Response(`Hello, never ${params.name}!`);
});

server.get("/:id", ({params}) => {
    return new Response(`Hello, overriden ${params.id}!`);
});

server.start({ port: 3000 });
