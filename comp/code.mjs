import { asyncify, read_async } from "./async.mjs"

export class Code {
	static async from_file(filename) {
		return asyncify(async (resolver) => {
			resolver(new Code(filename, await read_async(filename)));
		});
	}

	static async from_str(str, name="anonymous") {
		return asyncify((resolver) => {
			resolver(new Code(name, str));
		});
	}

	constructor(name, code) {
		this.name = name;

		this.preamble = "\0\0";
		this.epilogue = "\0\0";
		this.str = this.preamble + code + this.epilogue;
		this.start = this.preamble.length;
		this.end = this.str.length - this.epilogue.length;

		this.at = this.start;
		this.line = 1;
		this.col = 1;
	}

	pos() {
		return `${this.name}:${this.line}:${this.col}`;
	}

	move(to) {
		this.at = to;
	}

	eof() {
		return this.at >= this.end;
	}

	char(n=0) {
		return this.str[this.at + n];
	}

	atleast(n=1) {
		if(this.at + n > this.end) {
			this.throw(`Unexpected EOF`);
		}
	}

	skip(n=1) {
		const max = this.at + n;
		for(; this.at < max; ++this.at) {
			if(this.char() == "\n") {
				++this.line;
				this.col = 1;
			} else {
				++this.col;
			}
		}
	}

	next(n=1) {
		this.atleast(n);
		this.skip(n);
	}

	throw(str) {
		throw new SyntaxError(`${this.name}@${this.line}:${this.col} ${str}`);
	}
}
