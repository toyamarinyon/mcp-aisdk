import fs from "fs";
import path from "path";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { listTools } from "./tools.js";
import { getZodType } from "./zodTypeMapper.js"; // Assuming helper is in the same dir

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
const tools = await listTools(transport);

for (const { name, description, inputSchema } of tools) {
	const toolCode = `
export const ${name} = tool({
  description: '${description?.replace(/'/g, "\\'")}', // Escape single quotes in description
  parameters: inputSchema,
  execute: async (${executeParamsString}) => {
    // TODO: Implement the actual logic for the tool "${name}" here.
    // The parameters (${parameterNames.join(", ") || "none"}) are available in the scope.
    console.log('Executing tool: ${name}', ${executeParamsString});

    // Example placeholder return value:
    // Replace this with the actual result of your tool's execution.
    // The return value structure depends on what the AI expects or what you need downstream.
    return { success: true, message: 'Tool ${name} executed (placeholder)', /* add actual data here */ };

    // Example: If it was the weather tool:
    // return {
    //   location: location, // Assuming 'location' was a parameter
    //   temperature: 72,
    //   unit: unit || 'fahrenheit' // Assuming 'unit' was an optional parameter
    // };
  },
});
`;
}

// --- Configuration ---
const inputJsonPath = "./tools.json"; // Path to your input JSON file
const outputTsPath = "./generatedTools.ts"; // Path for the generated TypeScript file
// ---

function generateToolDefinition(toolJson) {
	const { name, description, parameters } = toolJson;

	if (!name || !description) {
		console.warn(
			`Skipping tool due to missing name or description: ${JSON.stringify(toolJson)}`,
		);
		return null;
	}

	// Sanitize name to be a valid JS variable name (simple version)
	const toolVariableName = name.replace(/[^a-zA-Z0-9_]/g, "_");

	let parametersString = "z.object({})"; // Default if no parameters
	const parameterNames = [];

	if (parameters && parameters.type === "object" && parameters.properties) {
		const properties = parameters.properties;
		const requiredParams = new Set(parameters.required || []);
		const propsString = Object.entries(properties)
			.map(([propName, propDefinition]) => {
				const isRequired = requiredParams.has(propName);
				parameterNames.push(propName); // Collect parameter names for execute signature
				const zodTypeString = getZodType(propDefinition, isRequired);
				// Indent property definition
				return `    ${propName}: ${zodTypeString}`;
			})
			.join(",\n");

		if (propsString) {
			// Add indentation for the object definition
			parametersString = `z.object({\n${propsString}\n  })`;
		}
	}

	// Create the execute function signature string
	const executeParamsString =
		parameterNames.length > 0 ? `{ ${parameterNames.join(", ")} }` : "{}";

	// Generate the tool code string
	// Use template literals for easier string construction and interpolation
	const toolCode = `
export const ${toolVariableName} = tool({
  description: '${description.replace(/'/g, "\\'")}', // Escape single quotes in description
  parameters: ${parametersString},
  execute: async (${executeParamsString}) => {
    // TODO: Implement the actual logic for the tool "${name}" here.
    // The parameters (${parameterNames.join(", ") || "none"}) are available in the scope.
    console.log('Executing tool: ${name}', ${executeParamsString});

    // Example placeholder return value:
    // Replace this with the actual result of your tool's execution.
    // The return value structure depends on what the AI expects or what you need downstream.
    return { success: true, message: 'Tool ${name} executed (placeholder)', /* add actual data here */ };

    // Example: If it was the weather tool:
    // return {
    //   location: location, // Assuming 'location' was a parameter
    //   temperature: 72,
    //   unit: unit || 'fahrenheit' // Assuming 'unit' was an optional parameter
    // };
  },
});
`;

	return toolCode;
}

function generateToolsFile(toolsJsonArray, outputPath) {
	const imports = `import { tool } from 'ai';\nimport { z } from 'zod';\n\n`;
	let allToolCode = imports;

	for (const toolJson of toolsJsonArray) {
		const toolCode = generateToolDefinition(toolJson);
		if (toolCode) {
			allToolCode += toolCode + "\n"; // Add a newline between tools
		}
	}

	try {
		fs.writeFileSync(outputPath, allToolCode, "utf8");
		console.log(`Successfully generated tool definitions at: ${outputPath}`);
	} catch (error) {
		console.error(`Error writing tools file to ${outputPath}:`, error);
	}
}

// --- Main Execution ---
try {
	const toolsJsonRaw = fs.readFileSync(inputJsonPath, "utf8");
	const toolsJsonArray = JSON.parse(toolsJsonRaw);

	if (!Array.isArray(toolsJsonArray)) {
		throw new Error("Input JSON must be an array of tool definitions.");
	}

	generateToolsFile(toolsJsonArray, outputTsPath);
} catch (error) {
	console.error(`Error processing tool generation:`, error);
	process.exit(1); // Exit with error code
}
