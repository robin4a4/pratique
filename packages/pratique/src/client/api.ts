type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type RequestOptions = {
  query?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
};

type ResponseType = {
  status: number;
  ok: boolean;
  json: () => Promise<any>;
};

function createHttpMethod(baseUrl: string, path: string, method: HttpMethod) {
  return async (options: RequestOptions = {}): Promise<ResponseType> => {
    let url = new URL(baseUrl + path);

    // Replace path parameters
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.pathname = url.pathname.replace(`:${key}`, value);
      }
    }

    // Add query parameters
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.append(key, value);
      }
    }

    const response = await fetch(url.toString(), {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    return {
      status: response.status,
      ok: response.ok,
      json: () => response.json(),
    };
  };
}


function createApiProxy(baseUrl: string, path: string = ''): any {
    return new Proxy({}, {
      get(_, prop) {
        console.log(prop);
        if (typeof prop === 'string') {
          if (['get', 'post', 'put', 'patch', 'delete'].includes(prop)) {
            const method = prop as HttpMethod;
            return createHttpMethod(baseUrl, path, method);
          }
          return createApiProxy(baseUrl, `${path}/${prop}`);
        }
        return undefined;
      }
    });
  }

  export function createApi<T>(baseUrl: string): T {
    return createApiProxy(baseUrl) as T;
  }
