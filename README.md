# Message to SQL Agent - HNG Stage 3

An AI-powered agent that converts natural language queries into production-ready SQL statements using Mastra AI and integrated with Telex.im.

## What It Does

This agent helps developers quickly translate their thoughts into SQL queries without having to remember complex syntax. Simply describe what you want to do in plain English, and the agent will:

- Generate accurate, well-formatted SQL queries
- Validate SQL for correctness and best practices
- Explain complex SQL queries in plain English
- Optimize queries for better performance
- Provide schema guidance and examples

## Features

### Core Capabilities

1. **Natural Language to SQL Conversion**
   - Supports SELECT, INSERT, UPDATE, DELETE operations
   - Handles complex queries with JOINs, subqueries, and aggregations
   - Works with multiple SQL dialects (PostgreSQL, MySQL, SQLite, MSSQL, Oracle)

2. **SQL Validation**
   - Syntax checking
   - Best practices enforcement
   - Security vulnerability detection
   - SQL injection prevention warnings

3. **SQL Explanation**
   - Breaks down complex queries into understandable components
   - Explains what each part of the query does

4. **Query Optimization**
   - Performance improvement suggestions
   - Index recommendations
   - Query rewriting for efficiency

5. **Schema Information**
   - Common database patterns
   - Table relationship guidance
   - Example queries for common scenarios

### Intelligent Tools

The agent uses specialized tools to enhance accuracy:

- **SQL Validator Tool**: Validates and formats SQL queries
- **Schema Info Tool**: Provides common database schema patterns
- **SQL Explainer Tool**: Explains queries in plain English
- **SQL Optimizer Tool**: Suggests performance improvements

### Quality Scoring

Built-in evaluation scorers ensure high-quality outputs:

- **SQL Correctness Scorer**: Validates syntax and best practices
- **Intent Match Scorer**: Ensures the query matches user intent
- **Readability Scorer**: Evaluates formatting and documentation

## Prerequisites

- Node.js >= 20.9.0
- npm or yarn
- OpenAI API key (for the LLM)
- Telex.im account access

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd hng-stage-three
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory:

```bash
GROQ_API_KEY=your_api_key
```

## Running the Agent

### Development Mode

Start the Mastra development server:

```bash
npm run dev
```

The agent will be available at `http://localhost:4111`

### Production Build

Build and start for production:

```bash
npm run build
npm start
```

## Usage Examples

### Example 1: Simple SELECT Query

**Input:**

```
Get all users who registered in the last 30 days
```

**Output:**

```sql
SELECT id, username, email, created_at
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY created_at DESC;
```

### Example 2: Complex JOIN Query

**Input:**

```
Show me all orders with customer details and product names for orders placed in January 2024
```

**Output:**

```sql
SELECT
    o.id AS order_id,
    o.order_date,
    o.total_amount,
    u.username,
    u.email,
    p.name AS product_name,
    oi.quantity,
    oi.price
FROM orders o
INNER JOIN users u ON o.user_id = u.id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.order_date >= '2024-01-01'
  AND o.order_date < '2024-02-01'
ORDER BY o.order_date DESC;
```

### Example 3: Aggregation Query

**Input:**

```
Calculate total revenue by category for the last quarter
```

**Output:**

```sql
SELECT
    c.name AS category_name,
    COUNT(DISTINCT o.id) AS order_count,
    SUM(o.total_amount) AS total_revenue,
    AVG(o.total_amount) AS average_order_value
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
INNER JOIN categories c ON p.category_id = c.id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '3 months'
  AND o.status = 'completed'
GROUP BY c.id, c.name
ORDER BY total_revenue DESC;
```

### Example 4: INSERT Statement

**Input:**

```
Add a new user with username 'john_doe', email 'john@example.com', and password hash
```

**Output:**

```sql
INSERT INTO users (username, email, password_hash, created_at, is_active)
VALUES ($1, $2, $3, NOW(), true)
RETURNING id, username, email, created_at;

-- Note: Use parameterized queries to prevent SQL injection
-- Parameters: $1 = 'john_doe', $2 = 'john@example.com', $3 = <hashed_password>
```

## Telex.im Integration

### Setup Steps

1. **Create an AI Co-Worker in Telex**
   - In your Telex dashboard, navigate to the AI Co-Workers section and create a new co-worker.

2. **Deploy Your Agent**
   - Deploy the Mastra agent to a public URL (e.g., using Vercel, Railway, or AWS)
   - Note your agent endpoint: `https://your-domain.com/a2a/agent/sqlAgent`

3. **Create Workflow in Telex**
   - Use the provided `telex-workflow.json` file
   - Update the `url` field with your deployed agent URL
   - Import the workflow into Telex.im

4. **Test the Integration**
   - Open Telex.im and navigate to your workflow
   - Send a message like: "Get all users created this month"
   - View agent logs at: `https://api.telex.im/agent-logs/{channel-id}.txt`

### Finding Your Channel ID

The channel ID is the first UUID in your Telex URL:

```
https://telex.im/telex-im/home/colleagues/[CHANNEL-ID]/[MESSAGE-ID]
                                         ^^^^^^^^^^
```

### Viewing Logs

Access agent interaction logs:

```
https://api.telex.im/agent-logs/[CHANNEL-ID].txt
```

## Project Structure

```
hng-stage-three/
├── src/
│   └── mastra/
│       ├── index.ts                 # Main Mastra configuration
│       ├── agents/
│       │   ├── sql-agent.ts         # SQL agent definition
│       │
│       ├── tools/
│       │   ├── sql-tool.ts          # SQL tools (validator, explainer, etc.)
│       │
│       ├── scorers/
│       │   ├── sql-scorer.ts        # SQL quality scorers
│       │
│       └── workflows/
│           ├── sql-workflow.ts      # SQL workflow definition
│
├── package.json
├── tsconfig.json
└── README.md
```

## Testing

### Manual Testing

Test the agent locally using the Mastra dev interface:

1. Start the dev server: `npm run dev`
2. Open http://localhost:4111
3. Navigate to the SQL agent
4. Try different natural language queries

### Example Test Cases

1. **Simple retrieval**: "Get all active users"
2. **Filtering**: "Find products under $50 in electronics category"
3. **Joins**: "Show orders with customer names and addresses"
4. **Aggregation**: "Count total orders by status"
5. **Complex query**: "Get top 10 customers by revenue in 2024 with their order details"

## Security Considerations

The agent emphasizes security best practices:

- Always recommends parameterized queries
- Warns about UPDATE/DELETE without WHERE clauses
- Detects potential SQL injection vulnerabilities
- Suggests proper input validation
- Recommends testing on development data first

## Supported SQL Dialects

- **PostgreSQL** (default)
- **MySQL**
- **SQLite**
- **Microsoft SQL Server**
- **Oracle**

Specify dialect in your query: "Generate a MySQL query to..."

## Limitations

- The agent generates queries based on common patterns; it may need clarification for custom schemas
- Complex business logic might require multiple iterations
- Always review and test generated queries before using in production
- The agent doesn't execute queries; it only generates them

## Author

Built for HNG Stage 3 Backend Task by Nebolisa Ugochukwu.

## Acknowledgments

- [Mastra AI](https://mastra.ai) - AI agent framework
- [Telex.im](https://telex.im) - Communication platform
- [HNG Internship](https://hng.tech) - Training program

## Additional Resources

- [Mastra Documentation](https://mastra.ai/docs)
- [Telex.im A2A Protocol](https://docs.telex.im)
