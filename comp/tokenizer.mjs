import { Code } from "./code.mjs"

export class CharRange {
	constructor(...ranges) {
		this.ranges = ranges;
		this.map = new Uint8Array(256);
		for(let range of ranges) {
			if(range instanceof CharRange) {
				for(let i = 0; i < 256; ++i) {
					this.map[i] |= range.map[i];
				}
				continue;
			}
			if(!(range instanceof Array) || range.length == 1) {
				range = [range, range].flat();
			}
			const [start, end] = range;
			for(let i = start; i <= end; ++i) {
				this.map[i] = 1;
			}
		}
	}

	includes(char) {
		if(typeof char == "string") {
			char = char.charCodeAt();
		}
		return this.map[char] == 1;
	}
}

export class Token {
	constructor(/** @type {Tokenizer} */ tokenizer, type) {
		this.tokenizer = tokenizer;
		this.code = this.tokenizer.code;

		this.start_at = this.code.at;
		this.start_line = this.code.line;
		this.start_col = this.code.col;

		this.type = type;
	}

	str() {
		return this.code.str.substring(this.start_at, this.end_at);
	}

	run() {
		this.parse();

		this.end_at = this.code.at;
		this.end_line = this.code.line;
		this.end_col = this.code.col;

		this.content = this.str();
	}

	move(to) {
		return this.code.move(to);
	}

	eof() {
		return this.code.eof();
	}

	char(n=0) {
		return this.code.char(n);
	}

	atleast(n=1) {
		return this.code.atleast(n);
	}

	skip(n=1) {
		return this.code.skip(n);
	}

	next(n=1) {
		return this.code.next(n);
	}

	throw(str) {
		return this.code.throw(`[${this.start_line}:${this.start_col}] ${str}`);
	}
}

export class CommentToken extends Token {
	static type = "CommentToken";
	static char_range = new CharRange(35);

	constructor(...args) {
		super(...args, CommentToken.type);

		this.run();
	}

	parse() {
		this.next();
		if(this.char() == "#") {
			/* Multiline */
			this.next(2);
			while(this.char() != "#" || this.char(-1) != "#" || this.char(-2) == '\\' || this.char(-3) == '\\') this.next();
			this.next();
		} else {
			while(this.char() != "\n") this.next();
		}
	}
}

export class StringToken extends Token {
	static type = "StringToken";
	static char_range = new CharRange(34, 39);

	constructor(...args) {
		super(...args, StringToken.type);

		this.run();

		this.string = this.content.substring(1, this.content.length - 1);
	}

	parse() {
		const char = this.char();
		this.next();

		while(this.char() != char || this.char(-1) == '\\' || this.char(-2) == '\\') this.next();

		this.next();
	}
}

export class NumberToken extends Token {
	static type = "NumberToken";
	static char_range = new CharRange([48, 57]);

	constructor(...args) {
		super(...args, NumberToken.type);

		this.number = null;

		this.run();
	}

	parse() {
		const parse_common = function(front_digits) {
			const is_dot = this.char() == ".";

			front_digits ||= "0";
			const integer = parseInt(front_digits);
			let fraction_digits = "";

			if(is_dot) {
				this.next();

				while(NumberToken.char_range.includes(this.char())) {
					fraction_digits += this.char();
					this.next();
				}
			}

			fraction_digits ||= "0";
			const fraction = parseInt(fraction_digits) * (10 ** -fraction_digits.length);

			let modifier = 0;
			if(this.char() == "e" || this.char() == "E") {
				this.next();

				let sign = 1;
				switch(this.char())
				{

				case "-": {
					sign = -1;
					/* fallthrough */
				}

				case "+": {
					this.next();
					break;
				}

				default: break;

				}

				let modifier_digits = "";
				while(NumberToken.char_range.includes(this.char())) {
					modifier_digits += this.char();
					this.next();
				}
				modifier_digits ||= "0";
				modifier = sign * parseInt(modifier_digits);
			}

			this.number = (integer + fraction) * (10 ** modifier);
		}.bind(this);

		const last_was_dot = this.tokenizer.last_token?.type == SymbolToken.type && this.tokenizer.last_token.symbol == "Dot";
		if(last_was_dot) {
			this.tokenizer.tokens.pop();
			this.move(--this.start_at);
			parse_common();
			return;
		}

		let front_digits = "";
		while(NumberToken.char_range.includes(this.char())) {
			front_digits += this.char();
			this.next();
		}

		const mod = this.char();
		let charset = null;
		let base = null;

		switch(mod) {

		case "B":
		case "b": {
			charset = new CharRange([48, 49]);
			base = 2;
			break;
		}

		case "Q":
		case "q": {
			charset = new CharRange([48, 51]);
			base = 4;
			break;
		}

		case "O":
		case "o": {
			charset = new CharRange([48, 55]);
			base = 8;
			break;
		}

		case "X":
		case "x": {
			charset = new CharRange([48, 57], [65, 70], [97, 102]);
			base = 16;
			break;
		}

		default: break;

		}

		if(charset) {
			if(front_digits != "0") {
				this.throw(`A number with a valid modifier cannot begin with anything but a zero, but found: '${front_digits}'`);
			}
			this.next();

			let digits = "";
			while(charset.includes(this.char())) {
				digits += this.char();
				this.next();
			}
			this.number = parseInt(digits, base);
		} else {
			while(NumberToken.char_range.includes(this.char())) {
				front_digits += this.char();
				this.next();
			}

			parse_common(front_digits);
		}
	}
}

export class SymbolToken extends Token {
	static type = "SymbolToken";
	static char_range = new CharRange(33, [37, 38], [40, 47], [58, 64], [91, 94], 96, [123, 126]);
	static symbols = {
		"": null,

		"++": "Increment",
		"--": "Decrement",
		"+": "Add",
		"-": "Subtract",
		"*": "Multiply",
		"/": "Divide",
		"%": "Modulo",
		">>": "ShiftRight",
		"<<": "ShiftLeft",

		"<": "LessThan",
		">": "GreaterThan",
		"<=": "LessEqual",
		">=": "GreaterEqual",
		"==": "Equal",
		"!=": "NotEqual",

		"$": "Dollar",
		":": "Colon",
		";": "Semicolon",
		",": "Comma",
		".": "Dot",
		"(": "OpenRoundBracket",
		")": "CloseRoundBracket",
		"{": "OpenCurlyBracket",
		"}": "CloseCurlyBracket",
		"[": "OpenSquareBracket",
		"]": "CloseSquareBracket",

		"=": "Equal",
		"+=": "AddEqual",
		"-=": "SubtractEqual",
		"*=": "MultiplyEqual",
		"/=": "DivideEqual",
		"%=": "ModuloEqual",
		">>=": "ShiftRightEqual",
		"<<=": "ShiftLeftEqual",

		"~": "BitNegate",
		"&": "BitAnd",
		"|": "BitOr",
		"^": "BitXor",
		"&=": "BitAndEqual",
		"|=": "BitOrEqual",
		"^=": "BitXorEqual",

		"!": "LogicNegate",
		"&&": "LogicAnd",
		"||": "LogicOr",
	};

	constructor(...args) {
		super(...args, SymbolToken.type);

		this.symbol = null;

		this.run();
	}

	parse() {
		let symbol = "";
		while(SymbolToken.symbols[symbol + this.char()]) {
			symbol += this.char();
			this.next();
		}
		this.symbol = SymbolToken.symbols[symbol];
	}
}

export class WordToken extends Token {
	static type = "WordToken";
	static char_range = new CharRange([1, 8], [14, 31], 36, [65, 90], 95, [97, 122], [127, 255]);
	static next_range = new CharRange(WordToken.char_range, NumberToken.char_range, 38);
	static keywords = {};
	static temp = [
		"alias",
		"as",
		"break",
		"const",
		"continue",
		"elif",
		"else",
		"enum",
		"export",
		"fn",
		"for",
		"from",
		"if",
		"import",
		"let",
		"loop",
		"macro",
		"pass",
		"phantom",
		"return",
		"scope",
		"static",
		"struct",
		"type",
		"while"
	].reduce(((obj, keyword) => { obj[keyword] = keyword; return obj; }), WordToken.keywords);

	constructor(...args) {
		super(...args, WordToken.type);

		this.run();
		this.keyword = WordToken.keywords[this.content];
	}

	parse() {
		this.next();
		while(WordToken.next_range.includes(this.char())) this.next();
	}
}

export class WhitespaceToken extends Token {
	static type = "WhitespaceToken";
	static char_range = new CharRange([9, 13], 32);

	constructor(...args) {
		super(...args, WhitespaceToken.type);

		this.run();
	}

	parse() {
		while(WhitespaceToken.char_range.includes(this.char())) this.next();
	}
}

export class Tokenizer {
	constructor(/** @type {Code} */ code) {
		this.code = code;

		/** @type {Array<Token>} */
		this.tokens = [];
		/** @type {?Token} */
		this.last_token = null;
	}

	push_token(token) {
		this.tokens.push(token);
		this.last_token = token;
	}

	tokenize() {
		/**
		 * Type of tokens:
		 *
		 * 1. Word
		 * 2. Whitespace
		 * 3. Symbol
		 * 4. Number
		 * 5. String
		 * 6. Comment
		 */

		let $_ = 0;
		while(!this.code.eof()) {
			if(++$_ > 123456789) {
				throw "Infinite loop";
			}

			const char = this.code.char();

			if(WhitespaceToken.char_range.includes(char)) {
				this.push_token(new WhitespaceToken(this));
				continue;
			}

			if(WordToken.char_range.includes(char)) {
				this.push_token(new WordToken(this));
				continue;
			}

			if(SymbolToken.char_range.includes(char)) {
				this.push_token(new SymbolToken(this));
				continue;
			}

			if(NumberToken.char_range.includes(char)) {
				this.push_token(new NumberToken(this));
				continue;
			}

			if(StringToken.char_range.includes(char)) {
				this.push_token(new StringToken(this));
				continue;
			}

			if(CommentToken.char_range.includes(char)) {
				this.push_token(new CommentToken(this));
				continue;
			}

			throw new Error("Unreachable");
		}

		return this.tokens;
	}

	coverage() {
		if(this.tokens.length > 0 && this.tokens[0].start_at != this.code.start) {
			throw `Tokenizer: Lack of full coverage at token 0 (code start)`;
		}
		for(let i = 1; i < this.tokens.length; ++i) {
			const prev = this.tokens[i - 1];
			const next = this.tokens[i];
			if(prev.end_at != next.start_at) {
				throw `Tokenizer: Lack of full coverage at tokens ${i - 1} and ${i}\n` +
					`Previous token:\n` +
					`\tType:			${prev.type}\n` +
					`\tStart index:	${prev.start_at}\n` +
					`\tStart line:		${prev.start_line}\n` +
					`\tStart col:		${prev.start_col}\n` +
					`\tEnd index:		${prev.end_at}\n` +
					`\tEnd line:		${prev.end_line}\n` +
					`\tEnd col:		${prev.end_col}\n` +
					`Next token:\n` +
					`\tType:			${next.type}\n` +
					`\tStart index:	${next.start_at}\n` +
					`\tStart line:		${next.start_line}\n` +
					`\tStart col:		${next.start_col}\n` +
					`\tEnd index:		${next.end_at}\n` +
					`\tEnd line:		${next.end_line}\n` +
					`\tEnd col:		${next.end_col}\n`;
			}
		}
		if(this.tokens.length > 0 && this.tokens[this.tokens.length - 1].end_at != this.code.end) {
			throw `Tokenizer: Lack of full coverage at token ${this.code.length} (code end)`;
		}

		console.log("Tokenizer: Full coverage");
	}

	dump() {
		console.log("Tokenizer dump:\n");

		const color = (token) => {
			switch(token.type) {

			case SymbolToken.type: return "\x1b[35m";
			case NumberToken.type: return "\x1b[34m";
			case StringToken.type: return "\x1b[36m";

			case WordToken.type: {
				if(token.keyword) {
					return "\x1b[33m";
				}
				/* fallthrough */
			}

			default: return "";

			}
		};

		let str = "\x1b[0m";
		for(const token of this.tokens) {
			str += color(token) + token.content + "\x1b[0m";
		}
		console.log(str);
	}
}
