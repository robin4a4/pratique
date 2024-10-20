import { createApi } from "pratique/client";

const api = createApi<any>("http://localhost:3000");

const { data } = await api.hello({ id: "world" }).get();
console.log(data);
