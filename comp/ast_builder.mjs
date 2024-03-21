import { Tokenizer } from "./tokenizer.mjs"

/*
	static precedence = {
		"Increment": 0,
		"Decrement": 0,
		"Add": 0,
		"Subtract": 0,
		"Multiply": 0,
		"Divide": 0,
		"Modulo": 0,
		"ShiftRight": 0,
		"ShiftLeft": 0,

		"LessThan": 0,
		"GreaterThan": 0,
		"LessEqual": 0,
		"GreaterEqual": 0,
		"Equal": 0,
		"NotEqual": 0,

		"Dollar": 0,
		"Colon": 0,
		"Semicolon": 0,
		"Comma": 0,
		"Dot": 0,
		"OpenRoundBracket": 0,
		"CloseRoundBracket": 0,
		"OpenCurlyBracket": 0,
		"CloseCurlyBracket": 0,
		"OpenSquareBracket": 0,
		"CloseSquareBracket": 0,

		"Equal": 0,
		"AddEqual": 0,
		"SubtractEqual": 0,
		"MultiplyEqual": 0,
		"DivideEqual": 0,
		"ModuloEqual": 0,
		"ShiftRightEqual": 0,
		"ShiftLeftEqual": 0,

		"BitNegate": 0,
		"BitAnd": 0,
		"BitOr": 0,
		"BitXor": 0,
		"BitAndEqual": 0,
		"BitOrEqual": 0,
		"BitXorEqual": 0,

		"LogicNegate": 0,
		"LogicAnd": 0,
		"LogicOr": 0,
	};
*/

export class ASTBuilder {
	constructor(/** @type {Tokenizer} */ tokenizer) {
		this.tokenizer = tokenizer;
		this.ast = [];
	}



	build() {
		while(this.tokenizer.tokens.length) {
			const token = this.tokenizer.tokens.pop();
			// alright now new stuff starts lol
		}
	}

	dump() {
		//
	}
}
