#!/usr/bin/env node
/**
 * Deploys MortgageStaking and MortgageLending to Base, in order,
 * using the public RPC. Run from this folder on your own machine:
 *
 *   cd contracts
 *   npm install
 *   echo "DEPLOYER_PRIVATE_KEY=0xyourkey" > .env   (never commit this)
 *   npm run deploy
 *
 * Flags:
 *   --compile-only   compile and report sizes, no network
 *   --yes            skip the confirmation prompt
 *   --testnet        deploy to Base Sepolia instead of mainnet
 *
 * Optional env: RPC_URL to override the public RPC.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import solc from "solc";
import { createPublicClient, createWalletClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

/* ------------------------------- parameters ------------------------------ */

const USDT = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2"; // USDT on Base
const MRT = "0xb200000000000000000000d8b21449ecf586c801"; // Mortgage Estate

const dir = path.dirname(fileURLToPath(import.meta.url));
const compileOnly = process.argv.includes("--compile-only");
const skipConfirm = process.argv.includes("--yes");
const useTestnet = process.argv.includes("--testnet");

/* --------------------------- tiny .env loader ---------------------------- */

const envPath = path.join(dir, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

/* -------------------------------- compile -------------------------------- */

console.log("── Compiling with solc", solc.version(), "…");

const sources = {};
for (const name of ["MortgageStaking.sol", "MortgageLending.sol"]) {
  sources[name] = { content: fs.readFileSync(path.join(dir, name), "utf8") };
}

const output = JSON.parse(
  solc.compile(
    JSON.stringify({
      language: "Solidity",
      sources,
      settings: {
        optimizer: { enabled: true, runs: 200 },
        outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
      },
    })
  )
);

const errors = (output.errors || []).filter((e) => e.severity === "error");
if (errors.length) {
  for (const e of errors) console.error(e.formattedMessage);
  process.exit(1);
}
for (const e of output.errors || []) {
  if (e.severity === "warning") console.log("  warn:", e.message.split("\n")[0]);
}

function artifact(file, name) {
  const contract = output.contracts[file][name];
  return { abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}` };
}

const staking = artifact("MortgageStaking.sol", "MortgageStaking");
const lending = artifact("MortgageLending.sol", "MortgageLending");

console.log(`   MortgageStaking  ${(staking.bytecode.length - 2) / 2} bytes`);
console.log(`   MortgageLending  ${(lending.bytecode.length - 2) / 2} bytes`);

if (compileOnly) {
  console.log("── Compile-only: OK");
  process.exit(0);
}

/* --------------------------------- deploy -------------------------------- */

const chain = useTestnet ? baseSepolia : base;
const rpcUrl =
  process.env.RPC_URL ||
  (useTestnet ? "https://sepolia.base.org" : "https://mainnet.base.org");

const pkRaw = process.env.DEPLOYER_PRIVATE_KEY || "";
if (!/^(0x)?[0-9a-fA-F]{64}$/.test(pkRaw)) {
  console.error(
    "\n✗ Set DEPLOYER_PRIVATE_KEY in contracts/.env (or the environment).\n" +
      "  The wallet needs a little ETH on " + chain.name + " for gas."
  );
  process.exit(1);
}
const account = privateKeyToAccount(pkRaw.startsWith("0x") ? pkRaw : `0x${pkRaw}`);

const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });

const balance = await publicClient.getBalance({ address: account.address });

console.log("\n── Deployment plan");
console.log("   Network   :", chain.name, `(chain ${chain.id})`);
console.log("   RPC       :", rpcUrl);
console.log("   Deployer  :", account.address);
console.log("   Balance   :", formatEther(balance), "ETH");
console.log("   1) MortgageStaking(mrt, usdt)");
console.log("        mrt  =", MRT);
console.log("        usdt =", USDT);
console.log("   2) MortgageLending(usdt)");
console.log("        usdt =", USDT);

if (balance === 0n) {
  console.error("\n✗ Deployer has 0 ETH — fund it for gas first.");
  process.exit(1);
}

if (!skipConfirm) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) =>
    rl.question(`\nType "yes" to deploy to ${chain.name}: `, resolve)
  );
  rl.close();
  if (answer.trim().toLowerCase() !== "yes") {
    console.log("Aborted.");
    process.exit(0);
  }
}

async function deploy(label, { abi, bytecode }, args) {
  console.log(`\n── Deploying ${label} …`);
  const hash = await walletClient.deployContract({ abi, bytecode, args });
  console.log("   tx:", hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success" || !receipt.contractAddress) {
    throw new Error(`${label} deployment failed (status ${receipt.status})`);
  }
  console.log("   ✓", label, "at", receipt.contractAddress);
  return receipt.contractAddress;
}

const stakingAddress = await deploy("MortgageStaking", staking, [MRT, USDT]);
const lendingAddress = await deploy("MortgageLending", lending, [USDT]);

const explorer = useTestnet ? "https://sepolia.basescan.org" : "https://basescan.org";
const result = {
  network: chain.name,
  chainId: chain.id,
  deployer: account.address,
  mrt: MRT,
  usdt: USDT,
  MortgageStaking: stakingAddress,
  MortgageLending: lendingAddress,
  deployedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(dir, "deployments.json"), JSON.stringify(result, null, 2));

console.log(`
── Done. Saved to contracts/deployments.json
   Staking : ${explorer}/address/${stakingAddress}
   Lending : ${explorer}/address/${lendingAddress}

── Next steps
   1. Paste both addresses into /admin/settings (and the staking
      address into each pool in /admin/pools).
   2. Lending: set the ETH price — setPrice(0x0000000000000000000000000000000000000000,
      <USDT per 1 ETH, 6 decimals — e.g. 4850 USDT → 4850000000>).
      List more collateral with setCollateral(token, ltvBps, decimals, price, true).
   3. Fund the lending contract with USDT so borrow() has liquidity
      (plain USDT transfer to ${lendingAddress}).
`);
