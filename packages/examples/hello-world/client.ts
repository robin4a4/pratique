import { createApi } from "pratique/client";

const api = createApi("http://localhost:3000");

// @ts-ignore
const res = await api.hello[":id"].get({
    params: {
        id: "world"
    }
});
console.log(res);
