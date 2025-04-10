// Function to camelCase a string (converting kebab-case or snake_case)
function toCamelCase(str: string): string {
	return str.replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Generate AI SDK tool definitions
export function generateToolsCode(
	serverName: string,
	// biome-ignore lint/suspicious/noExplicitAny: for library use
	toolsJson: any[],
): string {
	const toolName = toCamelCase(`${serverName}Tools`);
	let output = `import { tool } from 'ai'\nimport { z } from 'zod'\n\nexport const ${toolName} = {\n`;

	for (const tool of toolsJson) {
		const camelCasedName = toCamelCase(tool.name);

		// Start tool definition
		output += `  ${camelCasedName}: tool({\n`;
		output += `    description: '${tool.description.replace(/'/g, "\\'")}',\n`;

		// Generate parameters section using zod
		output += "    parameters: ";

		if (tool.inputSchema) {
			// Convert JSON Schema to Zod
			const zodSchema = generateZodSchema(tool.inputSchema);
			output += zodSchema;
		} else {
			output += "z.object({})";
		}

		output += ",\n";

		// Add execute function
		output += "    execute: async (params) => {\n";
		output += "      // TODO\n";
		output += "    }\n";

		// Close tool definition
		output += "  }),\n";
	}

	// Close tools object
	output += "}\n";

	return output;
}

// Function to generate Zod schema from JSON Schema
// biome-ignore lint/suspicious/noExplicitAny: for library use
function generateZodSchema(schema: any): string {
	if (schema.type === "object") {
		let output = "z.object({\n";

		// Add properties
		for (const [propName, propSchema] of Object.entries(
			schema.properties || {},
		)) {
			const camelCasedProp = toCamelCase(propName);
			output += `      ${camelCasedProp}: `;

			// Handle property type
			// biome-ignore lint/suspicious/noExplicitAny: for library use
			output += generatePropertySchema(propSchema as any);

			// Handle required fields
			if (!schema.required || !schema.required.includes(propName)) {
				output += ".optional()";
			}

			output += ",\n";
		}

		output += "    })";
		return output;
	}

	return "z.object({})";
}

// Function to generate Zod schema for a property
// biome-ignore lint/suspicious/noExplicitAny: for library use
function generatePropertySchema(schema: any): string {
	if (schema.type === "string") {
		let output = "z.string()";

		// Add description if available
		if (schema.description) {
			output += `.describe('${schema.description.replace(/'/g, "\\'")}')`;
		}

		// Handle enum values
		if (schema.enum) {
			const enumValues = schema.enum
				.map((val: string) => `'${val.replace(/'/g, "\\'")}'`)
				.join(", ");
			return `z.enum([${enumValues}])`;
		}

		return output;
	}
	if (schema.type === "number") {
		let output = "z.number()";

		// Add description if available
		if (schema.description) {
			output += `.describe('${schema.description.replace(/'/g, "\\'")}')`;
		}

		// Handle min/max constraints
		if (schema.minimum !== undefined) {
			output += `.min(${schema.minimum})`;
		}
		if (schema.maximum !== undefined) {
			output += `.max(${schema.maximum})`;
		}

		return output;
	}
	if (schema.type === "boolean") {
		let output = "z.boolean()";

		// Add description if available
		if (schema.description) {
			output += `.describe('${schema.description.replace(/'/g, "\\'")}')`;
		}

		return output;
	}
	if (schema.type === "array") {
		let output = `z.array(${generatePropertySchema(schema.items)})`;

		// Add description if available
		if (schema.description) {
			output += `.describe('${schema.description.replace(/'/g, "\\'")}')`;
		}

		return output;
	}
	// Default fallback
	return "z.any()";
}
