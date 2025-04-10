import { z } from "zod";

// Schema for server environment variables
const ServerEnvSchema = z.record(z.string());

// Schema for a specific MCP server configuration
const MCPServerSchema = z.object({
	type: z.enum(["stdio", "sse"]),
	command: z.string(),
	args: z.array(z.string()),
	env: ServerEnvSchema,
});

// Schema for the collection of MCP servers
const MCPServersSchema = z.record(MCPServerSchema);

// Schema for the entire .mcp.json file
export const MCPConfigSchema = z.object({
	mcpServers: MCPServersSchema,
});

// Type definitions derived from the schema
export type ServerEnv = z.infer<typeof ServerEnvSchema>;
export type MCPServer = z.infer<typeof MCPServerSchema>;
export type MCPServers = z.infer<typeof MCPServersSchema>;
export type MCPConfig = z.infer<typeof MCPConfigSchema>;
