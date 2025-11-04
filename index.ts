import { extractClaimData } from "./services/parsing";

const FILE_PATH = "./claims-data.csv";

const claimsRecords = await extractClaimData(FILE_PATH);

