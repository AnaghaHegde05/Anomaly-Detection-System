import { ethers } from "ethers";
import fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner();

  const artifactStr = fs.readFileSync("./artifacts/contracts/AnomalyLogger.sol/AnomalyLogger.json", "utf-8");
  const artifact = JSON.parse(artifactStr);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`AnomalyLogger deployed to: ${address}`);
  
  // Save the address to a file so backend and frontend can read it
  fs.writeFileSync("../contract_address.txt", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
