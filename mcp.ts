import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

export async function listTools(transport: Transport) {
	const client = new Client({
		name: "mcp-aisdk-client",
		version: "0.0.1",
	});

	try {
		await client.connect(transport);
		const result = await client.listTools();
		return result.tools;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to connect to MCP server");
	}
}
