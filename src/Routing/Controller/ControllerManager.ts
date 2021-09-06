import {injectable} from "tsyringe";
import {App} from "../../AppContainer";
import {Classes, DecoratorHelpers, METADATA} from "../../Common";
import {ControllerContract} from "../../Contracts/Routing/Controller/ControllerContract";
import {RouteContract} from "../../Contracts/Routing/Route/RouteContract";
import {Route} from "../Route/Route";
import {AllControllerMeta, ControllerMetadata} from "./ControllerDecorators";

export interface ControllerAndRoutes {
	controller: new () => ControllerContract;
	controllerName: string;
	routes: RouteContract[];
}

export class ControllerManager {

	public static routesList: { [key: string]: string } = {};

	/**
	 * We'll store an array of all paths that are registered as controller routes
	 * This isn't great, but the whole routing/controller management logic needs a refactor
	 *
	 * @type {string[]}
	 * @private
	 */
	private static routePathsRegistered: string[] = [];

	/**
	 * Store the metadata for this controller instance on Reflect
	 * so we can access the path registered for it, anywhere.
	 *
	 * @param path
	 */
	public static bindControllerMeta(path) {
		return function (target: any) {

			const currentMetadata: ControllerMetadata = {
				path            : path,
				target          : target,
				injectionParams : DecoratorHelpers.paramTypes(target) ?? [],
				modulePath      : Classes.getModulePathFromConstructor(target),
			};

			injectable()(target);

			//const params = DecoratorHelpers.paramTypes(target);
			Reflect.defineMetadata(METADATA.CONTROLLER, currentMetadata, target);

			const previousMetadata: ControllerMetadata[] = Reflect.getMetadata(
				METADATA.CONTROLLER,
				Reflect
			) || [];

			const newMetadata = [currentMetadata, ...previousMetadata];

			Reflect.defineMetadata(
				METADATA.CONTROLLER,
				newMetadata,
				Reflect
			);
		};
	}

	/**
	 * Pull all controllers from the container
	 * and setup the route instances for them
	 */
	static initiateControllers() {

		const controllers = App.getInstance().container().resolveAll<new () => ControllerContract>('Controllers');
		/*const controllers = App.getInstance()
		 .resolve(RouteServiceProvider)
		 .getAllControllers();*/

		const routes: ControllerAndRoutes[] = [];

		for (let controller of controllers) {
			const controllerRoutes = {
				controller     : controller,
				controllerName : controller.name,
				routes         : this.getRoutesForController(controller)
			};

			routes.push(controllerRoutes);

			for (let route of controllerRoutes.routes) {
				this.routePathsRegistered.push(route.getPath());
			}
		}

		return routes;
	}

	/**
	 * Get the metadata the controller
	 * Tells us the target for Reflect and it's path
	 */
	static getMeta(controller: any): AllControllerMeta {
		return {
			controller : Reflect.getMetadata(METADATA.CONTROLLER, controller),
			methods    : Reflect.getMetadata(METADATA.CONTROLLER_METHODS, controller)
		};
	}

	/**
	 * Return an array of routes for the specified Controller
	 *
	 * @param controller
	 * @private
	 */
	static getRoutesForController(controller: new () => ControllerContract) {
		const meta = this.getMeta(controller);

		if (!meta?.controller && !meta?.methods) {
			throw Error('Controller somehow has no meta defined... ' + controller.constructor.name);
		}

		const routes: Route[] = [];

		for (let methodKey in meta.methods) {
			const method = meta.methods[methodKey];

			routes.push(new Route(meta, method));
		}

		return routes;
	}

	/**
	 * Get a list of all registered paths.
	 *
	 * @returns {string[]}
	 */
	public static getRoutePaths(): string[] {
		return this.routePathsRegistered;
	}

	/**
	 * Check if the specific path is already registered
	 *
	 * @param {string} path
	 * @returns {boolean}
	 */
	public static hasPathRegistered(path: string): boolean {
		return this.routePathsRegistered.includes(path);
	}

}
