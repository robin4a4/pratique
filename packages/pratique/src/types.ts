export type MatchResultParam = {
    name: string;
    value: string;
}

export type MatchResult = {
    path: string;
    params: Array<MatchResultParam>;
};

type ExtractPathParams<T extends string> = T extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ExtractPathParams<Rest>
  : T extends `${string}:${infer Param}`
  ? Param
  : never;
export type ContextParams<TPath extends string> = Record<ExtractPathParams<TPath>, string>;

export type Context<TPath extends string> = {
    request: Request;
    params: ContextParams<TPath>;
    queryParams: URLSearchParams;
}

export type Handler<TPath extends string> = (context: Context<TPath>) => Response;

export type ServerOptions = {
    port: number;
}
