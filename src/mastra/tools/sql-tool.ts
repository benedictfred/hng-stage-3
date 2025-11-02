import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const sqlValidatorTool = createTool({
  id: "sql-validator",
  description:
    "Validates and formats SQL queries for correctness and best practices",
  inputSchema: z.object({
    sql: z.string().describe("SQL query to validate"),
    dialect: z
      .enum(["mysql", "postgresql", "sqlite", "mssql", "oracle"])
      .optional()
      .describe("SQL dialect to validate against"),
  }),
  outputSchema: z.object({
    isValid: z.boolean(),
    formatted: z.string(),
    warnings: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    return validateSQL(context.sql, context.dialect || "postgresql");
  },
});

export const schemaInfoTool = createTool({
  id: "schema-info",
  description:
    "Provides common database schema patterns and examples for SQL generation",
  inputSchema: z.object({
    tableType: z
      .string()
      .describe("Type of table (e.g., users, products, orders, transactions)"),
  }),
  outputSchema: z.object({
    commonColumns: z.array(z.string()),
    relationships: z.array(z.string()),
    examples: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    return getSchemaInfo(context.tableType);
  },
});

export const sqlExplainerTool = createTool({
  id: "sql-explainer",
  description: "Explains what a SQL query does in plain English",
  inputSchema: z.object({
    sql: z.string().describe("SQL query to explain"),
  }),
  outputSchema: z.object({
    explanation: z.string(),
    components: z.array(
      z.object({
        part: z.string(),
        description: z.string(),
      })
    ),
  }),
  execute: async ({ context }) => {
    return explainSQL(context.sql);
  },
});

export const sqlOptimizerTool = createTool({
  id: "sql-optimizer",
  description: "Suggests optimizations for SQL queries",
  inputSchema: z.object({
    sql: z.string().describe("SQL query to optimize"),
  }),
  outputSchema: z.object({
    optimized: z.string(),
    improvements: z.array(z.string()),
    performance: z.string(),
  }),
  execute: async ({ context }) => {
    return optimizeSQL(context.sql);
  },
});

function validateSQL(sql: string, dialect: string) {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let isValid = true;

  const trimmedSQL = sql.trim();

  const sqlKeywords = [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "DROP",
    "ALTER",
    "FROM",
    "WHERE",
    "JOIN",
  ];
  const hasKeyword = sqlKeywords.some((keyword) =>
    trimmedSQL.toUpperCase().includes(keyword)
  );

  if (!hasKeyword) {
    isValid = false;
    warnings.push("Query does not contain standard SQL keywords");
  }

  if (trimmedSQL.toUpperCase().includes("SELECT *")) {
    warnings.push(
      "Using SELECT * can impact performance. Consider specifying columns explicitly."
    );
  }

  if (
    (trimmedSQL.toUpperCase().includes("UPDATE") ||
      trimmedSQL.toUpperCase().includes("DELETE")) &&
    !trimmedSQL.toUpperCase().includes("WHERE")
  ) {
    warnings.push(
      "UPDATE/DELETE without WHERE clause will affect all rows. Be cautious!"
    );
  }

  if (
    trimmedSQL.toUpperCase().includes("JOIN") &&
    !trimmedSQL.toUpperCase().match(/INNER|LEFT|RIGHT|FULL|CROSS\s+JOIN/)
  ) {
    suggestions.push(
      "Consider using explicit JOIN type (INNER, LEFT, RIGHT, etc.) for clarity"
    );
  }

  const formatted = formatSQL(trimmedSQL);

  if (dialect === "postgresql") {
    suggestions.push(
      "PostgreSQL supports RETURNING clause for INSERT/UPDATE/DELETE operations"
    );
  } else if (dialect === "mysql") {
    suggestions.push("MySQL supports LIMIT clause for result pagination");
  }

  return {
    isValid,
    formatted,
    warnings,
    suggestions,
  };
}

function formatSQL(sql: string): string {
  let formatted = sql.replace(/\s+/g, " ").trim();

  const keywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "JOIN",
    "INNER JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "LIMIT",
    "OFFSET",
    "INSERT INTO",
    "VALUES",
    "UPDATE",
    "SET",
    "DELETE FROM",
  ];

  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    formatted = formatted.replace(regex, `\n${keyword.toUpperCase()}`);
  });

  formatted = formatted
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return formatted;
}

function getSchemaInfo(tableType: string) {
  const schemas: Record<string, any> = {
    users: {
      commonColumns: [
        "id",
        "username",
        "email",
        "password_hash",
        "created_at",
        "updated_at",
        "first_name",
        "last_name",
        "is_active",
      ],
      relationships: [
        "users have many orders",
        "users have many posts",
        "users belong to many roles",
      ],
      examples: [
        "SELECT * FROM users WHERE email = 'user@example.com'",
        "SELECT id, username, email FROM users WHERE is_active = true ORDER BY created_at DESC",
        "SELECT COUNT(*) FROM users WHERE created_at > '2024-01-01'",
      ],
    },
    products: {
      commonColumns: [
        "id",
        "name",
        "description",
        "price",
        "stock_quantity",
        "category_id",
        "sku",
        "created_at",
        "updated_at",
      ],
      relationships: [
        "products belong to categories",
        "products have many order_items",
        "products have many reviews",
      ],
      examples: [
        "SELECT * FROM products WHERE price < 100 AND stock_quantity > 0",
        "SELECT name, price FROM products WHERE category_id = 5 ORDER BY price ASC",
        "SELECT AVG(price) as avg_price FROM products GROUP BY category_id",
      ],
    },
    orders: {
      commonColumns: [
        "id",
        "user_id",
        "total_amount",
        "status",
        "order_date",
        "shipping_address",
        "payment_method",
        "created_at",
      ],
      relationships: [
        "orders belong to users",
        "orders have many order_items",
        "orders have one payment",
      ],
      examples: [
        "SELECT * FROM orders WHERE user_id = 123 ORDER BY order_date DESC",
        "SELECT COUNT(*) as order_count, SUM(total_amount) as total_revenue FROM orders WHERE status = 'completed'",
        "SELECT o.id, u.username FROM orders o JOIN users u ON o.user_id = u.id",
      ],
    },
  };

  const lowerTableType = tableType.toLowerCase();
  const schema = schemas[lowerTableType] || {
    commonColumns: ["id", "name", "created_at", "updated_at"],
    relationships: ["Depends on your specific database schema"],
    examples: [`SELECT * FROM ${tableType} LIMIT 10`],
  };

  return schema;
}

function explainSQL(sql: string) {
  const components: { part: string; description: string }[] = [];
  const upperSQL = sql.toUpperCase();

  let explanation = "This SQL query ";

  if (upperSQL.includes("SELECT")) {
    explanation += "retrieves data ";
    components.push({
      part: "SELECT",
      description: "Specifies which columns to retrieve",
    });

    if (sql.match(/SELECT\s+\*/i)) {
      components.push({
        part: "SELECT *",
        description: "Selects all columns from the table",
      });
    }
  } else if (upperSQL.includes("INSERT")) {
    explanation += "inserts new data ";
    components.push({
      part: "INSERT",
      description: "Adds new rows to a table",
    });
  } else if (upperSQL.includes("UPDATE")) {
    explanation += "modifies existing data ";
    components.push({
      part: "UPDATE",
      description: "Changes existing rows in a table",
    });
  } else if (upperSQL.includes("DELETE")) {
    explanation += "removes data ";
    components.push({
      part: "DELETE",
      description: "Removes rows from a table",
    });
  }

  const fromMatch = sql.match(/FROM\s+(\w+)/i);
  if (fromMatch) {
    explanation += `from the "${fromMatch[1]}" table `;
    components.push({
      part: "FROM",
      description: `Specifies the source table: ${fromMatch[1]}`,
    });
  }

  if (upperSQL.includes("WHERE")) {
    explanation += "with specific conditions ";
    components.push({
      part: "WHERE",
      description: "Filters rows based on specified conditions",
    });
  }

  if (upperSQL.includes("JOIN")) {
    explanation += "by combining data from multiple tables ";
    components.push({
      part: "JOIN",
      description:
        "Combines rows from two or more tables based on related columns",
    });
  }

  if (upperSQL.includes("GROUP BY")) {
    explanation += "and groups results by specific columns ";
    components.push({
      part: "GROUP BY",
      description: "Groups rows that have the same values in specified columns",
    });
  }

  if (upperSQL.includes("ORDER BY")) {
    explanation += "and sorts the results ";
    components.push({
      part: "ORDER BY",
      description: "Sorts the result set by specified columns",
    });
  }

  if (upperSQL.includes("LIMIT")) {
    explanation += "and limits the number of results returned";
    components.push({
      part: "LIMIT",
      description: "Restricts the number of rows returned",
    });
  }

  return {
    explanation,
    components,
  };
}

function optimizeSQL(sql: string) {
  const improvements: string[] = [];
  let optimized = sql;

  if (sql.toUpperCase().includes("SELECT *")) {
    improvements.push(
      "Replace SELECT * with specific column names to reduce data transfer"
    );
  }

  if (sql.toUpperCase().includes("WHERE")) {
    improvements.push("Ensure columns used in WHERE clause are indexed");
  }

  if (sql.match(/%.*LIKE/i)) {
    improvements.push(
      "LIKE patterns starting with % cannot use indexes efficiently"
    );
  }

  if (sql.toUpperCase().includes("NOT IN")) {
    optimized = sql.replace(/NOT IN/gi, "NOT EXISTS");
    improvements.push("Replaced NOT IN with NOT EXISTS for better performance");
  }

  if (sql.toUpperCase().match(/WHERE.*OR/)) {
    improvements.push(
      "Consider breaking OR conditions into UNION queries for better index usage"
    );
  }

  if (sql.match(/FROM\s+\w+\s*,\s*\w+/i)) {
    improvements.push(
      "Use explicit JOIN syntax instead of comma-separated tables for clarity"
    );
  }

  improvements.push(
    "Use EXPLAIN or EXPLAIN ANALYZE to understand query execution plan"
  );

  const performance =
    improvements.length > 2
      ? "This query has multiple optimization opportunities"
      : "This query looks relatively optimized";

  return {
    optimized,
    improvements,
    performance,
  };
}
