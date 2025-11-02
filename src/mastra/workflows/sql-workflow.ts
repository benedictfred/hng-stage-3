import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const generateSQLStep = createStep({
  id: "generate-sql",
  description: "Generates SQL query from natural language",
  inputSchema: z.object({
    message: z.string().describe("Natural language query to convert to SQL"),
    dialect: z
      .enum(["postgresql", "mysql", "sqlite", "mssql", "oracle"])
      .optional()
      .describe("SQL dialect preference"),
    context: z
      .string()
      .optional()
      .describe("Additional context like table schema or requirements"),
  }),
  outputSchema: z.object({
    sql: z.string(),
    explanation: z.string(),
    response: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }

    const agent = mastra?.getAgent("sqlAgent");
    if (!agent) {
      throw new Error("SQL agent not found");
    }

    let prompt = inputData.message;

    if (inputData.dialect) {
      prompt += `\n\nPlease use ${inputData.dialect.toUpperCase()} syntax.`;
    }

    if (inputData.context) {
      prompt += `\n\nAdditional context: ${inputData.context}`;
    }

    const response = await agent.stream([
      {
        role: "user",
        content: prompt,
      },
    ]);

    let responseText = "";
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      responseText += chunk;
    }

    // Extract SQL from code blocks if present
    const sqlMatch =
      responseText.match(/```sql\n([\s\S]*?)\n```/) ||
      responseText.match(/```\n([\s\S]*?)\n```/);
    const sql = sqlMatch ? sqlMatch[1] : responseText;

    return {
      sql,
      explanation: responseText,
      response: responseText,
    };
  },
});

const sqlWorkflow = createWorkflow({
  id: "sql-workflow",
  inputSchema: z.object({
    message: z.string().describe("Natural language query to convert to SQL"),
    dialect: z
      .enum(["postgresql", "mysql", "sqlite", "mssql", "oracle"])
      .optional()
      .describe("SQL dialect preference"),
    context: z
      .string()
      .optional()
      .describe("Additional context like table schema or requirements"),
  }),
  outputSchema: z.object({
    sql: z.string(),
    explanation: z.string(),
    response: z.string(),
  }),
}).then(generateSQLStep);

sqlWorkflow.commit();

export { sqlWorkflow };
