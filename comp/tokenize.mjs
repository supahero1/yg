import { CLI } from "./cli.mjs"
import { Compiler } from "./compiler.mjs"

const cli = new CLI("Yokogiri tokenizer", Compiler.stages.tokenizer);
await cli.run();
