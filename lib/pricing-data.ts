// lib/pricing-data.ts
// All prices in USD/user/month unless noted as total/month.
// Sources documented in PRICING_DATA.md — verify on submission week.

export type ToolId =
  | "cursor"
  | "github_copilot"
  | "claude"
  | "chatgpt"
  | "anthropic_api"
  | "openai_api"
  | "gemini"
  | "windsurf";

export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

export interface Plan {
  id: string;
  label: string;
  pricePerSeat: number; // USD/month per seat; 0 for usage-based/custom
  minSeats?: number;
  maxSeats?: number; // inclusive; undefined = unlimited
  isCustom?: boolean;
  isUsageBased?: boolean;
  features: string[];
  bestFor: UseCase[];
}

export interface ToolDef {
  id: ToolId;
  name: string;
  category: "coding" | "llm" | "api";
  plans: Plan[];
  pricingUrl: string;
}

export const TOOLS: Record<ToolId, ToolDef> = {
  cursor: {
    id: "cursor",
    name: "Cursor",
    category: "coding",
    pricingUrl: "https://cursor.sh/pricing",
    plans: [
      {
        id: "hobby",
        label: "Hobby",
        pricePerSeat: 0,
        features: ["2000 completions/month", "50 slow premium requests"],
        bestFor: ["coding"],
      },
      {
        id: "pro",
        label: "Pro",
        pricePerSeat: 20,
        features: ["Unlimited completions", "500 fast premium requests/month", "10 Claude Max uses/day"],
        bestFor: ["coding"],
      },
      {
        id: "business",
        label: "Business",
        pricePerSeat: 40,
        minSeats: 1,
        features: ["All Pro features", "Team admin", "SSO", "Privacy mode on"],
        bestFor: ["coding"],
      },
      {
        id: "enterprise",
        label: "Enterprise",
        pricePerSeat: 0,
        isCustom: true,
        features: ["Custom contract", "SAML SSO", "Audit logs", "Priority support"],
        bestFor: ["coding"],
      },
    ],
  },

  github_copilot: {
    id: "github_copilot",
    name: "GitHub Copilot",
    category: "coding",
    pricingUrl: "https://github.com/features/copilot#pricing",
    plans: [
      {
        id: "individual",
        label: "Individual",
        pricePerSeat: 10,
        maxSeats: 1,
        features: ["Code completions", "Chat in IDE", "CLI support"],
        bestFor: ["coding"],
      },
      {
        id: "business",
        label: "Business",
        pricePerSeat: 19,
        minSeats: 1,
        features: ["All Individual features", "Policy management", "Audit logs"],
        bestFor: ["coding"],
      },
      {
        id: "enterprise",
        label: "Enterprise",
        pricePerSeat: 39,
        minSeats: 1,
        features: [
          "All Business features",
          "Docsets",
          "Fine-tuned models",
          "Security scanning",
        ],
        bestFor: ["coding"],
      },
    ],
  },

  claude: {
    id: "claude",
    name: "Claude",
    category: "llm",
    pricingUrl: "https://www.anthropic.com/pricing",
    plans: [
      {
        id: "free",
        label: "Free",
        pricePerSeat: 0,
        features: ["Claude 3.5 Haiku access", "Limited messages"],
        bestFor: ["writing", "research", "mixed"],
      },
      {
        id: "pro",
        label: "Pro",
        pricePerSeat: 20,
        maxSeats: 1,
        features: ["5× more usage than Free", "Claude Sonnet 4", "Projects", "Priority access"],
        bestFor: ["writing", "research", "coding", "mixed"],
      },
      {
        id: "max",
        label: "Max",
        pricePerSeat: 100,
        maxSeats: 1,
        features: ["20× more usage than Pro", "Claude Opus 4 access", "Max usage limits"],
        bestFor: ["research", "data", "mixed"],
      },
      {
        id: "team",
        label: "Team",
        pricePerSeat: 30,
        minSeats: 5,
        features: ["Claude Sonnet 4 & Opus 4", "Shared Projects", "Admin controls", "Higher rate limits"],
        bestFor: ["writing", "research", "coding", "mixed"],
      },
      {
        id: "enterprise",
        label: "Enterprise",
        pricePerSeat: 0,
        isCustom: true,
        features: ["Custom usage limits", "SSO", "Audit logs", "Dedicated support"],
        bestFor: ["writing", "research", "coding", "data", "mixed"],
      },
    ],
  },

  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    category: "llm",
    pricingUrl: "https://openai.com/chatgpt/pricing/",
    plans: [
      {
        id: "free",
        label: "Free",
        pricePerSeat: 0,
        features: ["GPT-4o mini", "Limited GPT-4o messages"],
        bestFor: ["writing", "research", "mixed"],
      },
      {
        id: "plus",
        label: "Plus",
        pricePerSeat: 20,
        maxSeats: 1,
        features: ["GPT-4o", "o1 access", "DALL-E", "Advanced data analysis"],
        bestFor: ["writing", "research", "data", "mixed"],
      },
      {
        id: "team",
        label: "Team",
        pricePerSeat: 30,
        minSeats: 2,
        features: ["All Plus features", "Team workspace", "Admin console", "No training on data"],
        bestFor: ["writing", "research", "data", "mixed"],
      },
      {
        id: "enterprise",
        label: "Enterprise",
        pricePerSeat: 0,
        isCustom: true,
        features: ["Custom limits", "SSO/SAML", "Audit logs", "Priority support"],
        bestFor: ["writing", "research", "data", "coding", "mixed"],
      },
    ],
  },

  anthropic_api: {
    id: "anthropic_api",
    name: "Anthropic API",
    category: "api",
    pricingUrl: "https://www.anthropic.com/pricing#api",
    plans: [
      {
        id: "direct",
        label: "API Direct",
        pricePerSeat: 0,
        isUsageBased: true,
        features: [
          "Pay per token",
          "Haiku: $0.80/$4 per M tokens (in/out)",
          "Sonnet 4: $3/$15 per M tokens",
          "Opus 4: $15/$75 per M tokens",
        ],
        bestFor: ["coding", "writing", "data", "research", "mixed"],
      },
    ],
  },

  openai_api: {
    id: "openai_api",
    name: "OpenAI API",
    category: "api",
    pricingUrl: "https://openai.com/api/pricing/",
    plans: [
      {
        id: "direct",
        label: "API Direct",
        pricePerSeat: 0,
        isUsageBased: true,
        features: [
          "Pay per token",
          "GPT-4o mini: $0.15/$0.60 per M tokens",
          "GPT-4o: $2.50/$10 per M tokens",
          "o1: $15/$60 per M tokens",
        ],
        bestFor: ["coding", "writing", "data", "research", "mixed"],
      },
    ],
  },

  gemini: {
    id: "gemini",
    name: "Gemini",
    category: "llm",
    pricingUrl: "https://gemini.google.com/advanced",
    plans: [
      {
        id: "free",
        label: "Free",
        pricePerSeat: 0,
        features: ["Gemini 1.5 Flash", "Limited Gemini 1.5 Pro"],
        bestFor: ["writing", "research", "mixed"],
      },
      {
        id: "advanced",
        label: "Advanced (Google One AI Premium)",
        pricePerSeat: 20,
        maxSeats: 1,
        features: ["Gemini 1.5 Pro", "2TB storage", "Workspace integration"],
        bestFor: ["writing", "research", "data", "mixed"],
      },
      {
        id: "api",
        label: "API",
        pricePerSeat: 0,
        isUsageBased: true,
        features: ["Pay per token", "Free tier available", "Gemini Pro & Flash models"],
        bestFor: ["coding", "data", "mixed"],
      },
    ],
  },

  windsurf: {
    id: "windsurf",
    name: "Windsurf",
    category: "coding",
    pricingUrl: "https://windsurf.com/pricing",
    plans: [
      {
        id: "free",
        label: "Free",
        pricePerSeat: 0,
        features: ["Limited Flows", "Claude 3.5 Sonnet & GPT-4o"],
        bestFor: ["coding"],
      },
      {
        id: "pro",
        label: "Pro",
        pricePerSeat: 15,
        features: ["Unlimited flows", "Priority model access", "All frontier models"],
        bestFor: ["coding"],
      },
      {
        id: "teams",
        label: "Teams",
        pricePerSeat: 35,
        minSeats: 1,
        features: ["All Pro features", "Team management", "Usage analytics", "SSO"],
        bestFor: ["coding"],
      },
    ],
  },
};

export const TOOL_ORDER: ToolId[] = [
  "cursor",
  "github_copilot",
  "claude",
  "chatgpt",
  "anthropic_api",
  "openai_api",
  "gemini",
  "windsurf",
];
