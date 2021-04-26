"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const fastify_1 = __importDefault(require("fastify"));
const middie_1 = __importDefault(require("middie"));
const AppContainer_1 = require("../../AppContainer");
const Common_1 = require("../../Common");
const Routing_1 = require("../../Routing");
class Server {
    constructor() {
        /**
         * Allows the developer to implement their own error handling/formatting
         *
         * The framework package(that is cloned to create a new project) will implement
         * a base exception handler, by default the framework will use that class.
         * But... it can be over-ridden with a completely custom one.
         *
         * @private
         */
        this._customErrorHandler = null;
    }
    /**
     * Initialise fastify, add all routes to the application and apply any middlewares
     */
    initialise() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._server)
                throw new Error('Server has already been built');
            this._config = AppContainer_1.resolve(AppContainer_1.ConfigRepository).get('server');
            this._server = fastify_1.default(this._config.fastifyOptions);
            yield this._server.register(middie_1.default);
            this.registerPlugins();
            // Handled just before our controllers receive/process the request
            // This handler needs to work by it-self to provide the context
            this._server.addHook('preHandler', (request, response, done) => {
                //If this request is a cors preflight request... we don't want to handle our internal logic.
                if (request.corsPreflightEnabled) {
                    done();
                    return;
                }
                (new Routing_1.RequestContext(request, response)).bind(done);
            });
            // Handled just before our controllers receive/process the request
            this._server.addHook('preHandler', (request, response) => __awaiter(this, void 0, void 0, function* () {
                //If this request is a cors preflight request... we don't want to handle our internal logic.
                if (request.corsPreflightEnabled) {
                    return;
                }
                yield Routing_1.RequestContext.get().initiateForRequest();
                if (request.isMultipart())
                    yield Routing_1.UploadedFile.addToRequest(request);
            }));
            // Handled before the response is sent to the client
            this._server.addHook('onSend', (request, response) => __awaiter(this, void 0, void 0, function* () {
                //If this request is a cors preflight request... we don't want to handle our internal logic.
                if (request.corsPreflightEnabled) {
                    return;
                }
                Routing_1.RequestContext.response().cookieJar().setCookiesOnResponse();
            }));
            // Handled after the response has been sent to the client
            this._server.addHook('onResponse', (request, response) => __awaiter(this, void 0, void 0, function* () {
                //If this request is a cors preflight request... we don't want to handle our internal logic.
                if (request.corsPreflightEnabled) {
                    return;
                }
                if (Routing_1.RequestContext.isUsingSession())
                    yield Routing_1.RequestContext.session().save();
            }));
            this._server.addHook('onError', (request, reply, error, done) => {
                Common_1.Log.error(error.message);
                console.error(error);
                done();
            });
            this.registerControllers();
            return this._server;
        });
    }
    /**
     * Register all controller routes inside fastify
     *
     * @private
     */
    registerControllers() {
        //		this._server.register((instance, opts, done) => {
        const controllers = Routing_1.ControllerManager.initiateControllers();
        for (let controller of controllers) {
            const routes = controller.routes;
            for (let route of routes) {
                const handler = route.getMiddlewareHandler();
                this._server.route({
                    method: route.getMethod(),
                    handler: route.getHandlerFactory(),
                    url: route.getPath(),
                    preHandler: function (req, res) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (handler) {
                                const context = Routing_1.RequestContext.get();
                                yield handler(context);
                            }
                        });
                    },
                    errorHandler: (error, request, reply) => __awaiter(this, void 0, void 0, function* () {
                        yield this.handleException(error, request, reply);
                    })
                });
                Common_1.Log.info(`Route Loaded: ${controller.controller.constructor.name}(${route.getMethod()} ${route.getPath()})`);
            }
        }
        //			done();
        //		})
    }
    /**
     * This will register app Fastify Plugins from Config/App.ts > fastifyPlugins
     *
     * @private
     */
    registerPlugins() {
        // We have to make sure the cors configuration aligns with the framework configuration.
        if (this._config.cors.enabled) {
            this._config.fastifyPlugins.push([
                require('fastify-cors'),
                Object.assign(Object.assign({}, this._config.cors.options), {
                    optionsSuccessStatus: 202,
                    preflightContinue: true
                })
            ]);
        }
        this._config.fastifyPlugins.forEach(plugin => {
            this._server.register(plugin[0], plugin[1]);
        });
    }
    /**
     * Begin listening for connections
     */
    listen() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._server.listen(this._config.port);
            Common_1.Log.success('Server is running at http://127.0.0.1:' + this._config.port);
        });
    }
    setErrorHandling(handler) {
        this._customErrorHandler = handler;
    }
    handleException(error, request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._customErrorHandler) {
                const response = (error instanceof Common_1.Exception) ? error.response : {
                    message: error.message,
                    code: 500,
                };
                const code = (error instanceof Common_1.Exception) ? error.code : 500;
                return reply.status(code).send(response);
            }
            const response = yield this._customErrorHandler(error, request, reply);
            response.send();
        });
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map