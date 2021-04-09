import get from "lodash.get";
import set from "lodash.set";
import has from "lodash.has";
export class ConfigRepository {
    /**
     * Load all available Configuration
     *
     * We'll use dotnotate to allow us to access a value with a string
     * like "services.app", but then merge it with the original
     * so we can also access a base object like "services"
     *
     *
     * @param configDirectory
     * @private
     */
    async loadConfigFrom(configDirectory) {
        const conf = await import(configDirectory);
        this._config = conf.Config;
    }
    /**
     * Get a Config value by key
     *
     * @param key
     * @param _default
     */
    get(key, _default = null) {
        return get(this._config, key, _default);
        //return this._config[key] as T ?? _default;
    }
    /**
     * Set a Config on the repository
     *
     * @param key
     * @param value
     */
    set(key, value) {
        set(this._config, key, value);
        //		const constructedConfig = {};
        //
        //		if(key.includes('.')){
        //			const keys = key.split('.');
        //
        //			let currentConfig = this._config;
        //			for (let key of keys) {
        //				if(!currentConfig[key]){
        //					constructedConfig[key] = {};
        //					currentConfig[key] = {};
        //				}
        //
        //
        //			}
        //		}
        //
        //		constructedConfig[key] = value;
        //
        //		const configToSet = {...dotnotate(constructedConfig), ...constructedConfig};
        //
        //		this._config = {...this._config, ...configToSet};
    }
    /**
     * If the target is an array, then we'll push it to the array
     *
     * @param key
     * @param value
     */
    put(key, value) {
        const current = this.get(key);
        if (!current) {
            this.set(key, [value]);
            return;
        }
        if (!(Array.isArray(current))) {
            throw new Error('ConfigRepository: Target ' + key + ' is not an array');
        }
        current.push(value);
        this.set(key, current);
    }
    /**
     * Does a key exist in the Config?
     *
     * @param key
     */
    has(key) {
        return has(this._config, key);
        //		return !!this._config[key];
    }
}
//# sourceMappingURL=ConfigRepository.js.map