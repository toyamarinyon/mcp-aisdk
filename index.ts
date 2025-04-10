import { readFileSync, writeFileSync } from "node:fs";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import consola from "consola";
import { generateToolsCode } from "./generate-tool-code.js";
import { listTools } from "./mcp.js";
import { MCPConfigSchema, type MCPServer } from "./schema.js";

consola.box(
	"mcp-aisdk v0.0.1\nConvert tools of MPC you connect to AI SDK tools template code.\n\nCurrent version supports only stdio.",
);

const unsafeMcpJson = JSON.parse(readFileSync(".mcp.json", "utf-8"));
const parseResult = MCPConfigSchema.safeParse(unsafeMcpJson);
if (!parseResult.success) {
	consola.error(parseResult.error.message);
	process.exit(1);
}
const mcpConfig = parseResult.data;
const servers = [];
for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers)) {
	if (serverConfig.type !== "stdio") {
		continue;
	}
	servers.push({
		label: serverName,
		value: serverName,
	});
}

const serverName = await consola.prompt("Choose the server to generate tools", {
	type: "select",
	options: servers,
	cancel: "reject",
});

let serverConfig: MCPServer | undefined;

for (const [name, config] of Object.entries(mcpConfig.mcpServers)) {
	if (name === serverName) {
		serverConfig = config;
		break;
	}
}

if (serverConfig === undefined) {
	consola.error("Server not found");
	process.exit(1);
}

const transport = new StdioClientTransport({
	command: serverConfig.command,
	args: serverConfig.args,
});
consola.start("Connecting mcp server...");
const toolStrings = await listTools(transport);
consola.success("Connected to mcp server!!");

// Generate the code
consola.start("Generating mcp server tools to AI SDK tools...");
const toolsCode = generateToolsCode(serverName, toolStrings);
consola.success("Generated mcp server tools to AI SDK tools!");

// write the stdout of the server to tools.ts
consola.log("Saving server stdout to tools.ts...");
writeFileSync("tools.ts", toolsCode);
consola.success("Server stdout saved to tools.ts");

console.log("Generated AI SDK tools in tools.ts");

process.exit(0);
