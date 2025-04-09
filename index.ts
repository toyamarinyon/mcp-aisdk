import { writeFileSync } from "fs";
import { generateToolsCode } from "./generate-tool-code.js";
import consola from "consola";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { listTools } from "./mcp.js";

consola.info("======= mcp-aisdk v0.0.1 ========");
const name = await consola.prompt("Enter the server name ", {
  placeholder: "my server",
});

const commandStr = await consola.prompt("Enter the sever command", {
  placeholder: 'Command with arguments (e.g. docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN <<YOUR_TOKEN>> ghcr.io/github/github-mcp-server)'
})
const [command, ...args] = commandStr.split(' ')

const transport = new StdioClientTransport({
  command,
  args,
  env: {
  },
});
consola.start("Connecting mcp server...");
const toolStrings = await listTools(transport);
consola.success("Connected to mcp server!!")

// Generate the code
consola.start("Generating mcp server tools to AI SDK tools...");
const toolsCode = generateToolsCode(toolStrings);
consola.success("Generated mcp server tools to AI SDK tools!")

// write the stdout of the server to tools.ts
consola.log("Saving server stdout to tools.ts...");
writeFileSync("tools.ts", toolStrings.join("\n"));
consola.success("Server stdout saved to tools.ts");

// Output path (default or specified)
const outputPath = process.argv[3] || "./tools.ts";
writeFileSync(outputPath, toolsCode);

console.log(`Generated AI SDK tools in ${outputPath}`);
