import type {
	AeroJSParserConfig,
	RewriteOptions,
	aerogelParser,
	astParser,
	astWalker
} from "../../../types/rewriters/js";

import ASTRewriter from "./backends/AST";
import AeroGel from "./backends/AeroGel";

export default class JSRewriter {
	config: AeroJSParserConfig;
	constructor(config: AeroJSParserConfig) {
		this.config = config;
	}
	applyNewConfig(config: AeroJSParserConfig) {
		this.config = config;
	}
	rewriteScript(script: string, rewriteOptions: RewriteOptions): string {
		if (rewriteOptions.isModule) {
			if (this.config.modeModule === "ast")
				return this.astRewrite(script, rewriteOptions.isModule);
			if (this.config.modeModule === "aerogel")
				return this.aerogelRewrite(script, rewriteOptions.isModule);
		} else {
			if (this.config.modeDefault === "ast")
				return this.astRewrite(script, rewriteOptions.isModule);
			if (this.config.modeDefault === "aerogel")
				return this.aerogelRewrite(script, rewriteOptions.isModule);
		}
		return script;
	}
	/** Calls the AST Rewriter with the config that you provided in the constructor earlier */
	astRewrite(script, isModule: boolean): string {
		let parserOfChoice: astParser;
		let walkerOfChoice: astWalker;
		for (const astParser of this.config.preferredParsers.ast) {
			const astSupportedParsers = ASTRewriter.supportedParsers();
			if (astParser in astSupportedParsers) {
				parserOfChoice = astParser;
			}
		}
		if (!parserOfChoice) {
			$aero.logger.fatalErr(
				"No compatible AST parsers found with your preferred list of parsers!"
			);
			return script;
		}
		for (const astWalker of this.config.preferredASTWalkers) {
			const astSupportedWalkers = ASTRewriter.supportedWalkers();
			if (astWalker in astSupportedWalkers) walkerOfChoice = astWalker;
		}
		if (!walkerOfChoice) {
			$aero.logger.fatalErr(
				"No compatible AST walkers found with your preferred list of walkers!"
			);
			return script;
		}

		// @ts-ignore
		const astRewriter = new ASTRewriter({
			parserConfig: {
				parser: parserOfChoice
			},
			walkerConfig: {
				walker: walkerOfChoice
			}
		});
		return astRewriter.rewriteScript(script, isModule);
	}
	aerogelRewrite(script, isModule: boolean): string {
		let parserOfChoice: aerogelParser;
		for (const aerogelParser of this.config.preferredParsers.aerogel) {
			const aerogelSupportedParsers = AeroGel.supportedParsers();
			if (aerogelParser in aerogelSupportedParsers)
				parserOfChoice = aerogelParser;
		}
		if (!parserOfChoice)
			$aero.logger.fatalErr(
				"No compatible AeroGel parsers found with your preferred list of parsers!"
			);

		// @ts-ignore
		const aerogelRewriter = new AeroGel({
			parserConfig: {
				parser: parserOfChoice
			}
		});
		return aerogelRewriter.jailScript(script, isModule);
	}
	/** This is the method you want to use in your proxy */
	wrapScript(script: string, rewriteOptions: RewriteOptions): string {
		const lines = this.rewriteScript(script, rewriteOptions).split("\n");

		const [first] = lines;

		const _meta = rewriteOptions.isModule
			? `${this.config.proxyNamespace}.moduleScripts.resolve`
			: "";

		lines[0] = rewriteOptions.insertCode + _meta + first;

		return lines.join("\n");
	}
}
