import { Authenticatable } from "../../Common";
import { AuthenticationIdentifier } from "../../Config/Auth";
import { UserProvider } from "./UserProvider";
export declare class BaseUserProvider extends UserProvider {
    getUser(id: string): Promise<Authenticatable>;
    userForIdentifier(identifier: AuthenticationIdentifier): Promise<Authenticatable>;
}