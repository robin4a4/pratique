// Define the HTTP methods we'll support
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

// Options for making a request
type RequestOptions = {
  query?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
};

// Structure of the response we'll return
type ResponseType<T = any> = {
  data: T | null;
  error: Error | null;
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
    try {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (error) {
        data = await response.text();
      }

      // Return a standardized response object
      return {
        data,
        error: null,
      };
    } catch (error) {
        console.log("error", error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
      };
    }
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
      if (['get', 'post', 'put', 'patch', 'delete'].includes(prop)) {
        return createHttpMethod(baseUrl, path, prop as HttpMethod);
      }
      if (prop === 'index') {
        return createApiProxy(baseUrl, path);
      }
      return createApiProxy(baseUrl, `${path}/${prop}`);
    },
    apply(target: any, thisArg: any, args: any[]) {
      const params = args[0] || {};
      let newPath = path;
      const paramValues = Object.values(params);
      newPath = [newPath, ...paramValues].filter(Boolean).join('/');
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
