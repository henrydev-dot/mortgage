export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "What exactly do I own when I buy a property token?",
    answer:
      "Each token represents a fractional beneficial interest in a special-purpose vehicle (SPV) that holds legal title to the underlying property. Ownership records are maintained onchain on Base and mirrored in the SPV's legal register, so your claim is enforceable both onchain and in court.",
  },
  {
    question: "How is rental yield distributed?",
    answer:
      "Net rental income is collected by the licensed property manager, converted to USDC, and streamed to token holders monthly, pro rata to holdings. Distributions are claimable from the protocol at any time and visible on the property's onchain ledger.",
  },
  {
    question: "Can I sell my tokens before the property is sold?",
    answer:
      "Yes. Property tokens trade continuously on the built-in secondary orderbook. Liquidity varies by property, but you are never locked in until an exit event — pricing is set by real-time demand.",
  },
  {
    question: "Why is the protocol built on Base?",
    answer:
      "Base offers Ethereum-grade security with sub-cent transaction costs and native USDC settlement — essential for monthly yield distribution to thousands of holders. Its Coinbase lineage also aligns with our regulated-custody posture.",
  },
  {
    question: "Is Mortgage Estate regulated?",
    answer:
      "Property SPVs are established in regulated jurisdictions with licensed custodians and independent auditors. Token offerings follow the applicable securities frameworks of each jurisdiction; KYC/AML verification is required before minting.",
  },
  {
    question: "What happens if a property is sold?",
    answer:
      "A sale requires a token-holder vote passing the protocol threshold. On completion, net proceeds are converted to USDC and distributed pro rata, and the property tokens are burned onchain.",
  },
];
