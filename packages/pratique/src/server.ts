export type Handler = (req: Request) => Response;
export type ServerOptions = {
    port: number;
}
export type PathObject = {
    path: string;
    value: string | null;
}

export class Server {
    getHandlers = new Map();
    postHandlers = new Map();
    putHandlers = new Map();
    deleteHandlers = new Map();

    get(path: string, handler: Handler) {
        this.getHandlers.set(path, handler);
    }

    post(path: string, handler: Handler) {
        this.postHandlers.set(path, handler);
    }

    put(path: string, handler: Handler) {
        this.putHandlers.set(path, handler);
    }

    delete(path: string, handler: Handler) {
        this.deleteHandlers.set(path, handler);
    }

    start({ port }: ServerOptions) {
        const getHandlers = this.getHandlers;
        const postHandlers = this.postHandlers;
        const putHandlers = this.putHandlers;
        const deleteHandlers = this.deleteHandlers;
        Bun.serve({
            port: port ?? 3000,
            fetch(req) {
                const pathWithDomain = req.url.split('?')[0];
                const path = pathWithDomain.replace('http://localhost:3000', '');
                const method = req.method;

                console.log(method, path);

                if (method === 'GET') {
                    const allStoredPaths = Array.from(getHandlers.keys());
                    // const eligiblePaths = allStoredPaths.filter(storedPath => {
                    //     const storedPathParts = storedPath.split('/');
                    //     const pathParts = path.split('/');
                    //     if (storedPathParts.length !== pathParts.length) {
                    //         return false;
                    //     }

                    //     for (let i = 0; i < storedPathParts.length; i++) {
                    //         if (storedPathParts[i] !== pathParts[i] && !storedPathParts[i].startsWith(':')) {
                    //             return false;
                    //         }
                    //     }

                    //     return true;
                    // });
                    const eligiblePathObjects: Array<PathObject> = [];
                    allStoredPaths.forEach(storedPath => {
                        const storedPathParts = storedPath.split('/').filter((part: string) => part !== '');
                        const pathParts = path.split('/').filter((part: string) => part !== '');
                        if (storedPathParts.length !== pathParts.length) {
                            return
                        }

                        for (let i = 0; i < storedPathParts.length; i++) {
                            if (storedPathParts[i] === pathParts[i]) {
                                eligiblePathObjects.push({path: storedPath, value: null});
                            } else if (storedPathParts[i] !== pathParts[i] && storedPathParts[i].startsWith(':')) {
                                eligiblePathObjects.push({path: storedPath, value: pathParts[i]});
                            }
                        }

                        return ;
                    });

                    const lastEligiblePath = eligiblePathObjects[eligiblePathObjects.length - 1];
                    if (getHandlers.has(lastEligiblePath.path)) {
                        let request = req;
                        if (lastEligiblePath.value) {
                            request = new Request(req.url, {
                                ...req,
                                params: {
                                    [lastEligiblePath.path.split('/')[1]]: lastEligiblePath.value,
                                },
                            });
                        }
                        return getHandlers.get(lastEligiblePath.path)(request);
                    }
                }

                if (method === 'POST' && postHandlers.has(path)) {
                    return postHandlers.get(path)(req);
                }

                if (method === 'PUT' && putHandlers.has(path)) {
                    return putHandlers.get(path)(req);
                }

                if (method === 'DELETE' && deleteHandlers.has(path)) {
                    return deleteHandlers.get(path)(req);
                }

                return new Response('Not found', {
                    status: 404,
                    statusText: 'Not Found',
                });
            },
        });
    }
}
