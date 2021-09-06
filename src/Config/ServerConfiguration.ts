import {ClassTransformOptions} from "class-transformer/types/interfaces";
import {FastifyPlugin, FastifyPluginOptions, FastifyServerOptions} from "fastify";
import {FastifyCorsOptions} from "fastify-cors";
import {default as FastifyMultipart, FastifyMultipartOptions} from "fastify-multipart";
import {ConfigurationCredentials} from "../AppContainer/Config/ConfigurationCredentials";
import {ServerConfiguration as ServerConfig} from "../Contracts/Server/ServerContract";
import {InjectViewGlobals} from "../Routing/Views/InjectViewGlobals";
import {StartSessionMiddleware} from "../Session/Middleware/StartSessionMiddleware";


export default class ServerConfiguration extends ConfigurationCredentials implements ServerConfig {

	/**
	 * The port that fastify will listen on
	 */
	port = 3000;

	/**
	 * Global middleware that will run on every application request
	 */
	middleware = [
		StartSessionMiddleware,
		InjectViewGlobals,
	];

	/**
	 * Any cookie names that you wish to not encrypt/decrypt
	 */
	disableCookieEncryption = [];

	/**
	 * Cors is automatically configured internally due to some framework
	 * configuration that needs to align. But you can also adjust the
	 * configuration you wish to use here.
	 */
	cors = {
		enabled : true,
		options : {
			origin      : (origin: string, callback) => {
				callback(null, true);
			},
			credentials : true,
		} as FastifyCorsOptions
	};

	/**
	 * Server providers are Fastify Plugins that you register to the server when it's booted.
	 */
	fastifyPlugins: Array<[FastifyPlugin, FastifyPluginOptions]> = [
		[FastifyMultipart, {} as FastifyMultipartOptions],
		[require('fastify-helmet'), {contentSecurityPolicy : false}]
	];

	/**
	 * Any options to pass to fastify when it boots
	 *
	 */
	fastifyOptions: FastifyServerOptions = {};

	/**
	 * Before we return a response we serialize the result, mainly
	 * so that class transformer can do it's work, but also to help
	 * with random errors that occur from circular references.
	 *
	 * excludeExtraneousValues can induce results that you might not
	 * expect but helps prevent internal references used in your code
	 * and the framework from being returned in a response.
	 */
	responseSerialization: ClassTransformOptions = {
		enableCircularCheck : true,
		strategy            : "exposeAll",
		//		excludeExtraneousValues : true,
	};

}
