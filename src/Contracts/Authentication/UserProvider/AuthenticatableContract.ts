import {ObjectId} from "mongodb";
import {ModelConstructorOrInstantiatedModel} from "../../../Authorization/Authorization";

export interface AuthenticatableContract<T> {
	_user: any;

	generateToken(additionalPayload?: any): string;

	sendSocketChannelEvent(channel: string, eventName: string, data: any): void;

	sendSocketEvent(eventName: string, data: any): void;

	setUser(user: any): AuthenticatableContract<T>;

	getUser<T>(): T;

	getId(): ObjectId;

	can<T extends ModelConstructorOrInstantiatedModel>(permission: string, model: T, ...additional): Promise<boolean>;

	cannot<T extends ModelConstructorOrInstantiatedModel>(permission: string, model: T, ...additional): Promise<boolean>;

	toJSON(): Record<string, any>;
}
