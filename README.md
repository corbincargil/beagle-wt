# beagle-wt

An AI-driven system for automating the evaluation of Security Deposit Insurance (SDI) claims. The system processes claim documents, classifies charges according to Beagle's SDI policy, and calculates payout amounts using deterministic rules.

## Overview

This monorepo contains:
- **Pipeline** (`apps/pipeline`): Processes CSV claim records and tenant documents, extracts text from PDFs, uses AI models (Anthropic/Mistral) to classify charges, and applies SDI policy logic to compute payouts
- **Web** (`apps/web`): Next.js application for viewing and managing claim results
- **Shared Packages** (`packages/shared`): Shared database schemas, types, and utilities

## Potential Improvements for v1

- Use LangChain for improved AI auditability (prompt versioning, reasoning traceability, accuracy tracking)
- Centralize prompt management in a versioned system (LangSmith, PromptLayer)
- Use S3 for document storage instead of local filesystem
- Process claims via streaming instead of loading everything into memory
- Support resuming from checkpoints if processing is interrupted
- Split document handling into its own microservice

## Tech Stack

- **Runtime**: Bun v1.2.9
- **AI APIs**: Anthropic (Claude)
- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Language**: TypeScript

## Getting Started

### Installation

```bash
bun install
```

### Running the Pipeline

```bash
cd apps/pipeline
bun run server
```

### Running the Web App

```bash
cd apps/web
bun run dev
```

### Development

Run all apps in development mode:

```bash
bun run dev
```

## Project Structure

```
beagle-wt/
├── apps/
│   ├── pipeline/     # Claim processing pipeline
│   └── web/          # Next.js web application
└── packages/
    └── shared/       # Shared database and types
```

## Environment Variables

Make sure to configure your environment variables for:
- Anthropic API key
- PostgreSQL connection string
