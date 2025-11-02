import { z } from "zod";
import { createScorer } from "@mastra/core/scores";

export const sqlCorrectnessScorer = createScorer({
  name: "SQL Correctness",
  description:
    "Evaluates if the generated SQL is syntactically correct and follows best practices",
  type: "agent",
  judge: {
    model: "groq/llama-3.1-8b-instant",
    instructions:
      "You are an expert SQL reviewer. Evaluate the SQL query for syntax correctness, best practices, and potential security issues. " +
      "Check for proper use of keywords, appropriate WHERE clauses, avoidance of SELECT *, and security vulnerabilities. " +
      "Return only structured JSON matching the provided schema.",
  },
})
  .preprocess(({ run }) => {
    const assistantText = (run.output?.[0]?.content as string) || "";
    const sqlMatch =
      assistantText.match(/```sql\n([\s\S]*?)\n```/) ||
      assistantText.match(/```\n([\s\S]*?)\n```/);
    const sql = sqlMatch ? sqlMatch[1] : assistantText;
    return { sql };
  })
  .analyze({
    description: "Analyze SQL correctness and best practices",
    outputSchema: z.object({
      isSyntacticallyCorrect: z.boolean(),
      hasBestPractices: z.boolean(),
      securityIssues: z.array(z.string()),
      confidence: z.number().min(0).max(1),
      feedback: z.string(),
    }),
    createPrompt: ({ results }) => `
      Evaluate this SQL query:
      """
      ${results.preprocessStepResult.sql}
      """
      
      Check for:
      1. Syntax correctness (proper SQL keywords, structure)
      2. Best practices (explicit column names, appropriate WHERE clauses, JOIN syntax)
      3. Security issues (SQL injection vulnerabilities, missing WHERE in UPDATE/DELETE)
      
      Return JSON with:
      {
        "isSyntacticallyCorrect": boolean,
        "hasBestPractices": boolean,
        "securityIssues": string[],
        "confidence": number,
        "feedback": string
      }
    `,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult || {};
    let score = 1.0;
    if (!r.isSyntacticallyCorrect) score -= 0.5;
    if (!r.hasBestPractices) score -= 0.2;
    if (r.securityIssues && r.securityIssues.length > 0) score -= 0.3;
    return Math.max(0, Math.min(1, score * (r.confidence ?? 1)));
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return `SQL Correctness: syntax=${r.isSyntacticallyCorrect ?? false}, bestPractices=${r.hasBestPractices ?? false}, securityIssues=${r.securityIssues?.length ?? 0}. Score=${score}. ${r.feedback ?? ""}`;
  });

export const intentMatchScorer = createScorer({
  name: "Intent Match",
  description:
    "Evaluates if the SQL query matches the user's intended operation",
  type: "agent",
  judge: {
    model: "xai/grok-beta",
    instructions:
      "You are an expert at understanding user intent and matching it to SQL operations. " +
      "Determine if the generated SQL query correctly addresses what the user asked for. " +
      "Return only structured JSON matching the provided schema.",
  },
})
  .preprocess(({ run }) => {
    const userText = (run.input?.inputMessages?.[0]?.content as string) || "";
    const assistantText = (run.output?.[0]?.content as string) || "";
    const sqlMatch =
      assistantText.match(/```sql\n([\s\S]*?)\n```/) ||
      assistantText.match(/```\n([\s\S]*?)\n```/);
    const sql = sqlMatch ? sqlMatch[1] : assistantText;
    return { userText, sql };
  })
  .analyze({
    description: "Analyze if SQL matches user intent",
    outputSchema: z.object({
      matchesIntent: z.boolean(),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
    }),
    createPrompt: ({ results }) => `
      User asked:
      """
      ${results.preprocessStepResult.userText}
      """
      
      Generated SQL:
      """
      ${results.preprocessStepResult.sql}
      """
      
      Determine if the SQL correctly addresses the user's request. Consider:
      - Does the operation type match (SELECT, INSERT, UPDATE, DELETE)?
      - Are the right tables/columns targeted?
      - Does it accomplish what the user wants?
      
      Return JSON with:
      {
        "matchesIntent": boolean,
        "confidence": number,
        "reasoning": string
      }
    `,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return r.matchesIntent ? (r.confidence ?? 0.9) : 0.2;
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return `Intent Match: matches=${r.matchesIntent ?? false}, confidence=${r.confidence ?? 0}. Score=${score}. ${r.reasoning ?? ""}`;
  });

export const readabilityScorer = createScorer({
  name: "SQL Readability",
  description: "Evaluates if the SQL query is well-formatted and documented",
  type: "agent",
  judge: {
    model: "xai/grok-beta",
    instructions:
      "You are an expert at SQL code quality and readability. " +
      "Evaluate if the SQL is well-formatted, properly indented, and includes helpful comments. " +
      "Return only structured JSON matching the provided schema.",
  },
})
  .preprocess(({ run }) => {
    const assistantText = (run.output?.[0]?.content as string) || "";
    // Extract SQL from code blocks
    const sqlMatch =
      assistantText.match(/```sql\n([\s\S]*?)\n```/) ||
      assistantText.match(/```\n([\s\S]*?)\n```/);
    const sql = sqlMatch ? sqlMatch[1] : assistantText;
    return { sql };
  })
  .analyze({
    description: "Analyze SQL readability",
    outputSchema: z.object({
      isFormatted: z.boolean(),
      hasComments: z.boolean(),
      readabilityScore: z.number().min(0).max(1),
      suggestions: z.array(z.string()),
    }),
    createPrompt: ({ results }) => `
      Evaluate the formatting and readability of this SQL:
      """
      ${results.preprocessStepResult.sql}
      """
      
      Check for:
      1. Proper line breaks and formatting
      2. Indentation
      3. Uppercase keywords
      4. Comments for complex logic
      5. Table aliases in JOINs
      
      Return JSON with:
      {
        "isFormatted": boolean,
        "hasComments": boolean,
        "readabilityScore": number,
        "suggestions": string[]
      }
    `,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return r.readabilityScore ?? 0.5;
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult || {};
    return `Readability: formatted=${r.isFormatted ?? false}, hasComments=${r.hasComments ?? false}. Score=${score}. Suggestions: ${r.suggestions?.join(", ") ?? "none"}`;
  });

export const scorers = {
  sqlCorrectnessScorer,
  intentMatchScorer,
  readabilityScorer,
};
