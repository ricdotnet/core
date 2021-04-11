import {Exception} from "@envuso/common";

export class InvalidRefSpecified extends Exception {
	constructor(entityName: string, ref: string) {
		super('Ref ' + ref + ' is not defined on model(entity) ' + entityName);
	}
}
