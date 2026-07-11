# Mortgage Estate — Contracts (testnet build)

Two self-contained Solidity 0.8.24 contracts, no external imports.
Deploy with the included script (recommended) or paste into
[Remix](https://remix.ethereum.org). Test on **Base Sepolia**
(chain 84532) first, then Base mainnet (8453).

## Deploy from your PC

```bash
cd contracts
npm install

# your deployer wallet's private key — NEVER commit this file
echo "DEPLOYER_PRIVATE_KEY=0xyourprivatekey" > .env

npm run deploy:testnet   # Base Sepolia dry run (wallet needs Sepolia ETH)
npm run deploy           # Base mainnet — asks for a "yes" confirmation
```

The script compiles both contracts (solc 0.8.26, optimizer on), shows
the plan (network, deployer, balance, constructor args — MRT and USDT
addresses are prefilled), deploys **MortgageStaking(mrt, usdt)** then
**MortgageLending(usdt)** over the Base public RPC, waits for receipts,
and writes the addresses to `contracts/deployments.json`. Use
`RPC_URL=` in `.env` to override the RPC, `npm run compile` to
compile without deploying.

> ⚠️ These are owner-centric by design (project requirement for the
> testnet phase): the owner can reprice collateral, adjust debts, seize
> positions, and rescue all funds. Get them audited and communicate the
> custody model clearly to users before any mainnet launch with real
> value.

## MortgageStaking.sol

Constructor: `(mrtToken, usdtToken)`

- Pool 0 — MRT only (min 1,000 MRT, 30-day lock)
- Pool 1 — MRT + USDT (min 500 MRT, 60-day lock)
- Users: `stake(poolId, mrtAmount, usdtAmount)` (approve first),
  `unstake(index)` after unlock
- Records: `positionsOf(user)`, `stakerSlice(start, count)`,
  `pools(poolId)` — everything the admin panel needs
- Owner: `setPool`, `ownerRelease(user, index)` (early release back to
  the user), `rescueToken`, `rescueETH`, `transferOwnership`

## MortgageLending.sol

Constructor: `(usdtToken)` — USDT is the borrow asset (6 decimals).

- Owner lists collateral with `setCollateral(token, ltvBps, decimals,
  priceUsdt, active)`; `address(0)` = native ETH (pre-listed at 70%
  LTV — set its price). `priceUsdt` = USDT (6 decimals) per 1 whole
  token. Update prices with `setPrice` (manual oracle).
- Users: `depositETH()` / `depositToken`, `borrow(amount)` up to
  `creditLimit`, `repay(amount)`, `withdraw` while staying solvent.
- Interest: simple APR (`setBorrowApr`, default 8%), accrued on touch.
- Fund the contract with USDT (plain transfer) so `borrow` has
  liquidity.
- Admin reads: `positionOf(user)` (all collateral + debt + limit),
  `borrowerSlice(start, count)`, `collateralConfig(token)`.
- Owner: `ownerSetDebt`, `ownerSeize`, `setPaused`, `rescueToken`,
  `rescueETH`, `transferOwnership`.

## After deploying

Paste the addresses into the app: `/admin/settings` (staking + lending
contract fields) and each pool's contract field in `/admin/pools`.

Base addresses: USDT `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2`,
MRT `0xb200000000000000000000d8b21449ecf586c801`.
