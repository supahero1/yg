import { Compiler } from "./compiler.mjs"
import { asyncify } from "./async.mjs";
import { ArgumentParser } from "argparse";
import package_json from "./package.json" assert { type: "json" }
import { stdin } from "node:process";

export class CLI {
	constructor(description, stage) {
		this.parser = new ArgumentParser({ description });
		this.parser.add_argument("-v", "--version", { action: "version", version: package_json.version });
		this.parser.add_argument("files", { nargs: "*", help: "Any input files" });

		this.stage = stage;
	}

	async run() {
		const args = this.parser.parse_args();
		let compiler;

		if(!args.files?.length) {
			console.log("Waiting for input...");

			let input = "";
			await asyncify((resolver) => {
				stdin.on("data", (chunk) => {
					input += chunk.toString();
				});
				stdin.on("end", resolver);
			});

			if(!input.endsWith("\n")) {
				console.log();
			}

			compiler = Compiler.from_str(input);
		} else {
			compiler = Compiler.from_file(args.files[0]);
		}

		(await compiler).compile(this.stage, true);
	}
}
