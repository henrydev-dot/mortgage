/**
 * Deterministic messages signed by wallets for off-chain DAO actions.
 * Shared by client (signing) and server (verification) — no fs imports.
 */

export function voteMessage(proposalId: string, support: boolean) {
  return `Mortgage Estate DAO\nAction: vote\nProposal: ${proposalId}\nChoice: ${support ? "FOR" : "AGAINST"}`;
}

export function proposalMessage(title: string) {
  return `Mortgage Estate DAO\nAction: create-proposal\nTitle: ${title}`;
}
