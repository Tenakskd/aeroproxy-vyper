import {
	AltProtocolEnum,
	type APIInterceptor,
	ExposedContextsEnum
} from "$types/apiInterceptors";

// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import escape from "$shared/escape";

export default {
	proxifiedObj: Proxy.revocable(RTCPeerConnection, {
		construct(target, args) {
			const [config] = args;

			// Backup
			const iceServersBak = config.iceServers;

			if (config.iceServers && config.wrtcBackends.length > 0) {
				config.iceServers = config.wrtcBackends;
				args[0] = config;
			}

			const ret = new target(...args);

			ret["_iceServers"] = iceServersBak;

			return ret;
		},
		get(target, prop) {
			return typeof prop === "string" && escape("iceServers").test(prop)
				? target[`_${prop}`]
				: Reflect.get(target, prop);
		},
		set(target, prop, value) {
			if (typeof prop === "string" && escape("iceServers").test(prop)) {
				target[`_${prop}`] = value;
				return true;
			}
			return Reflect.set(target, prop, value);
		}
	}),
	globalProp: "RTCPeerConnection",
	forAltProtocol: AltProtocolEnum.webRTC,
	exposedContexts: ExposedContextsEnum.window
} as APIInterceptor;
