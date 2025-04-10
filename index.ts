import { writeFileSync } from "node:fs";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import consola from "consola";
import { generateToolsCode } from "./generate-tool-code.js";
import { listTools } from "./mcp.js";

consola.box(
	"mcp-aisdk v0.0.1\nConvert tools of MPC you connets to AI SDK tools template code.",
);
const name = await consola.prompt("Enter the server name ", {
	placeholder: "my server",
});

const commandStr = await consola.prompt("Enter the sever command", {
	placeholder:
		"Command with arguments (e.g. docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN <<YOUR_TOKEN>> ghcr.io/github/github-mcp-server)",
});
const [command, ...args] = commandStr.split(" ");

const transport = new StdioClientTransport({
	command,
	args,
});
consola.start("Connecting mcp server...");
const toolStrings = await listTools(transport);
consola.success("Connected to mcp server!!");

// Generate the code
consola.start("Generating mcp server tools to AI SDK tools...");
const toolsCode = generateToolsCode(name, toolStrings);
consola.success("Generated mcp server tools to AI SDK tools!");

// write the stdout of the server to tools.ts
consola.log("Saving server stdout to tools.ts...");
writeFileSync("tools.ts", toolsCode);
consola.success("Server stdout saved to tools.ts");

console.log("Generated AI SDK tools in tools.ts");

process.exit(0);
