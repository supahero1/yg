import { Code } from "./code.mjs"
import { Tokenizer } from "./tokenizer.mjs"
import { ASTBuilder } from "./ast_builder.mjs"

export class Compiler {
	static stages = {
		tokenizer: 0,
		ast_builder: 1
	};

	static async from_file(filename) {
		return new Compiler(await Code.from_file(filename));
	}

	static async from_str(str, name="anonymous") {
		return new Compiler(await Code.from_str(str, name));
	}

	constructor(/** @type {Code} */ code) {
		this.code = code;
	}

	compile(stage=Infinity, debug=false) {
		/** @type {Tokenizer} */
		let tokenizer;
		if(stage >= Compiler.stages.tokenizer) {
			tokenizer = new Tokenizer(this.code);
			tokenizer.tokenize();
			if(debug) {
				tokenizer.coverage();
				tokenizer.dump();
			}
		}

		/** @type {ASTBuilder} */
		let ast_builder;
		if(stage >= Compiler.stages.ast_builder) {
			ast_builder = new ASTBuilder(tokenizer);
			ast_builder.build();
			if(debug) {
				ast_builder.dump();
			}
		}
	}
}
