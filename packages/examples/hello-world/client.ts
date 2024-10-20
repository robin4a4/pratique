import { createApi } from "pratique/client";

const api = createApi("http://localhost:3000");

// @ts-ignore
const res = await api.hello({ id: "world" }).get();
console.log(res.json());
