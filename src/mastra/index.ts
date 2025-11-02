import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { sqlWorkflow } from "./workflows/sql-workflow";
import { sqlAgent } from "./agents/sql-agent";
import {
  sqlCorrectnessScorer,
  intentMatchScorer,
  readabilityScorer,
} from "./scorers/sql-scorer";
import { VercelDeployer } from "@mastra/deployer-vercel";

export const mastra = new Mastra({
  workflows: { sqlWorkflow },
  agents: { sqlAgent },
  scorers: {
    sqlCorrectnessScorer,
    intentMatchScorer,
    readabilityScorer,
  },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  telemetry: {
    // Telemetry is deprecated and will be removed in the Nov 4th release
    enabled: false,
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true },
  },
});
