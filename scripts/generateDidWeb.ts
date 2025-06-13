import { generateKeyPair, issueDID, VerificationType } from "@trustvc/trustvc/w3c/issuer";
import { writeFileSync } from "fs";
import { join } from "path";
import { writeEnvVariable } from "./utils";

const main = async () => {
  const keyPair = await generateKeyPair({
    type: VerificationType.Bls12381G2Key2020,
  });
  const issuedDidWeb = await issueDID({
    domain: process.env.APP_DOMAIN,
    ...keyPair,
  });

  // Write the wellKnownDid to a JSON file
  const outputPath = join(process.cwd(), "did.json");
  writeFileSync(outputPath, JSON.stringify(issuedDidWeb.wellKnownDid, null, 2));
  console.log("DID document has been written to ./did.json");

  // write issuedDidWeb.didKeyPairs into .env as DID_KEY_PAIRS key
  writeEnvVariable("DID_KEY_PAIRS", JSON.stringify(issuedDidWeb.didKeyPairs));
};
main();