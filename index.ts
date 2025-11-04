import { extractTextFromPdf } from "./services/documents";
import { extractClaimData } from "./services/parsing";

const FILE_PATH = "./data/claims-data.csv";

//* 1. Parse the CSV file and sanitize the data into ClaimRecord objects
const claimsRecords = await extractClaimData(FILE_PATH);

//* 2. Process documents for each claim and extract the data into ClaimResult objects 
//*     input: claimsRecords -> output: claimsRecords with Documents
// const pdfText = await extractTextFromPdf("./data/documents/1/305 Coosawatchie St move out calculation - hall.pdf");
// console.log(pdfText)

//* 3. Validate the data and filter out invalid claims
//* 4. Anaylze valid claims (process each payment) and calculate the final payout
//* 5. Aggregate all results into structured JSON and summary CSV outputs