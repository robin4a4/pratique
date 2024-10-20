// Define the HTTP methods we'll support
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

// Options for making a request
type RequestOptions = {
  query?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
};

// Structure of the response we'll return
type ResponseType = {
  status: number;
  ok: boolean;
  json: () => Promise<any>;
};

function concatenateUrl(baseUrl: string, path: string) {
    if (path === "") {
        return baseUrl;
    }
    const baseUrlWithoutTrailingSlash = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const pathWithoutLeadingSlash = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrlWithoutTrailingSlash}/${pathWithoutLeadingSlash}`;
}

/**
 * Creates a function to make an HTTP request for a specific method and path
 * @param baseUrl The base URL of the API
 * @param path The path for this specific endpoint
 * @param method The HTTP method to use
 * @returns A function that makes the HTTP request
 */
function createHttpMethod(baseUrl: string, path: string, method: HttpMethod) {
  return async (options: RequestOptions = {}): Promise<ResponseType> => {
    // Construct the full URL
    let fullPath = concatenateUrl(baseUrl, path);

    // Replace path parameters if any
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        fullPath = fullPath.replace(`:${key}`, encodeURIComponent(value));
      }
    }

    // Construct the URL object after replacing path parameters
    let url = new URL(fullPath);

    // Add query parameters if any
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.append(key, value);
      }
    }

    // Make the fetch request
    const response = await fetch(url.toString(), {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // Return a standardized response object
    return {
      status: response.status,
      ok: response.ok,
      json: () => response.json(),
    };
  };
}

/**
 * Creates a proxy object that dynamically handles API paths and methods
 * @param baseUrl The base URL of the API
 * @param path The current path (used for recursive calls)
 * @returns A proxy object representing the API
 */
function createApiProxy(baseUrl: string, path: string = ''): any {
  const handler = {
    get(target: any, prop: string) {
      console.log('get', target, prop, path);
      if (['get', 'post', 'put', 'patch', 'delete'].includes(prop)) {
        return createHttpMethod(baseUrl, path, prop as HttpMethod);
      }
      if (prop === 'index') {
        return createApiProxy(baseUrl, path);
      }
      return createApiProxy(baseUrl, `${path}/${prop}`);
    },
    apply(target: any, thisArg: any, args: any[]) {
      console.log('apply', target, thisArg, args);
      const params = args[0] || {};
      let newPath = path;
      console.log("path", path, params);
      const paramValues = Object.values(params);
      newPath = [newPath, ...paramValues].filter(Boolean).join('/');
      console.log("newPath", newPath);
      return createApiProxy(baseUrl, newPath);
    }
  };

  // Create a function that can also be used as an object
  const proxy = new Proxy(() => {}, handler);
  return new Proxy(proxy, handler);
}

/**
 * Creates an API client
 * @param baseUrl The base URL of the API
 * @returns A proxy object representing the API
 */
export function createApi<T>(baseUrl: string): T {
  return createApiProxy(baseUrl) as T;
}
