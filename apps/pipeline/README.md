# beagle-wt

This MVP demonstrates a pipeline that bulk-processes Security Deposit Insurance (SDI) claims using the provided SDI Policy Guidelines via the Anthropic API. The system automates the evaluation of claims by parsing claim documents, classifying line items according to Beagle's SDI policy, and applying deterministic rules to calculate payout amounts.

## Pipeline Overview

1. Takes a claims CSV as input and sanitizes the data
2. Saves the clean data to `data/claims-records.json` and to the PostgreSQL database
3. Uploads documents to Claude API in batches
4. Processes claims through two-phase analysis:
   - Phase 1: Classifies documents, verifies required documents, checks first month's rent and SDI premium payment
   - Phase 2: Analyzes charge line items, classifies as covered/excluded, calculates eligible totals
5. Applies SDI policy logic to determine claim status and final payout
6. Saves final results to `data/claim-results.json` and to the PostgreSQL database

## Installation

```bash
bun install
```

## Usage

Run the pipeline with:

```bash
bun run index.ts
```

Clean up (delete) the Claude files with:

```bash
bun run cleanup-claude-files
```

### Environment Variables

- `ANTHROPIC_API_KEY` - Anthropic API key
- `DATABASE_URL` - PostgreSQL database connection string (required for database persistence)
- `RAW_CLAIMS_FILE_PATH` - Path to input CSV (default: `./data/raw-claims-data.csv`)
- `SANITIZED_CLAIMS_FILE_PATH` - Path for sanitized JSON output (default: `./data/claims-records.json`)
- `CLAIMS_RESULTS_FILE_PATH` - Path for final results JSON (default: `./data/claim-results.json`)

### Configuration

Set `CLAIMS_BATCH_SIZE` in `index.ts` to control document upload batching (default: 50 claims per batch).

## Data Structure

### Sanitized Claims Records

After parsing and sanitization, claims are stored as structured JSON:

```json
{
  "trackingNumber": "1",
  "claimDate": "03/04/22",
  "propertyAddress": "305 Coosawatchie St, Summerville, SC, 29485-6804",
  "leaseStartDate": "12/24/21",
  "moveOutDate": "03/01/22",
  "propertyManagementCompany": "New Heights Property Management",
  "groupNumber": "GR0001",
  "treatyNumber": "T00001",
  "policy": "613R",
  "maxBenefit": 2500,
  "status": "posted",
  "documents": [
    {
      "name": "305 Coosawatchie St move out calculation - hall.pdf",
      "path": "data/documents/1/305 Coosawatchie St move out calculation - hall.pdf"
    }
  ],
  "claudeFiles": [
    {
      "type": "file",
      "id": "file_011CUp4u3htj8UstzAfy8car",
      "size_bytes": 7895,
      "created_at": "2025-11-05T03:55:23.370000Z",
      "filename": "305 Coosawatchie St move out calculation - hall.pdf",
      "mime_type": "application/pdf",
      "downloadable": false
    }
  ]
}
```

### Output: Claim Results

Final results include AI analysis, charge classifications, and payout calculations:

```json
{
  "trackingNumber": "1",
  "tenantName": "Brittani Elizabeth Hall and Joshua Justin Hall",
  "status": "declined",
  "maxBenefit": 2500,
  "monthlyRent": 0,
  "isFirstMonthPaid": false,
  "firstMonthPaidEvidence": "The tenant ledger shows unpaid rent charges starting from 12/16/2021...",
  "isFirstMonthSDIPremiumPaid": false,
  "firstMonthSDIPremiumPaidEvidence": "The tenant ledger shows 'SDRP Monthly Premium' charges...",
  "missingRequiredDocuments": ["lease_addendum", "lease_agreement"],
  "submittedDocuments": [
    {
      "types": ["notification_to_tenant", "tenant_ledger"],
      "name": "Move Out Calculation",
      "path": "Document 1"
    }
  ],
  "approvedCharges": [],
  "approvedChargesTotal": 0,
  "excludedCharges": [],
  "finalPayout": 0,
  "decisionSummary": "Claim DECLINED. Critical required documents are missing..."
}
```

## Document Structure

Claims are organized by tracking number in `data/documents/`:

```
data/documents/
├── 1/
│   └── 305 Coosawatchie St move out calculation - hall.pdf
├── 2/
│   ├── 2013 Wishing Well move out calculation.pdf
│   ├── Walker, Iyanla Docusign_NHPM_Lease_v_2021_(...).pdf
│   └── Walker, Iyanla DOCUSIGN_-_Security_Deposit_Addendum__(...).pdf
└── ...
```

## Technology Stack

- **Runtime**: Bun v1.2.9
- **Language**: TypeScript
- **AI API**: Anthropic (Claude)
- **Database**: PostgreSQL (via Drizzle ORM)
- **Data Processing**: CSV parsing, JSON serialization
- **Validation**: Zod schemas
