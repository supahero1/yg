import { CLI } from "./cli.mjs"
import { Compiler } from "./compiler.mjs"

const cli = new CLI("Yokogiri AST builder", Compiler.stages.ast_builder);
await cli.run();
