import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

const transport = new StdioClientTransport({
	command: "docker",
	args: [
		"run",
		"-i",
		"--rm",
		"-e",
		"GITHUB_PERSONAL_ACCESS_TOKEN",
		"ghcr.io/github/github-mcp-server",
	],
	env: {
		GITHUB_PERSONAL_ACCESS_TOKEN: "",
	},
});

const client = new Client({
	name: "example-client",
	version: "1.0.0",
});

await client.connect(transport);

export async function listTools(transport: Transport) {
	const client = new Client({
		name: "mcp-aisdk-client",
		version: "0.0.1",
	});

	await client.connect(transport);
	const result = await client.listTools();
	return result.tools;
}
