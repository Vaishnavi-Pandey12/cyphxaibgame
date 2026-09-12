import { StageInfo } from "@/types/theme";

export const STAGES_LIST: StageInfo[] = [
  {
    id: "stage-1",
    stageNumber: 1,
    code: "STG 01",
    name: "FLIGHT 404",
    suit: "DIAMONDS",
    suitSymbol: "♦",
    suitCategory: "INTELLECT",
    subTitle: "THE LAST SEAT",
    tagline: "SAME SKY. DIFFERENT DESTINY.",
    trialType: "COUNTRY CIPHER TRIAL",
    clearanceLevel: "LEVEL 1 CIPHER",
    initialCountdown: 60,
    survivalQuota: "1 SAFE COUNTRY SEAT",
    description: "Twenty operatives are assigned seats named after countries. One country is safe — the rest are deadly. Decode the 3 country hints (capital, currency, population) to identify the safe country and lock your seat before time expires.",
    rules: [
      "3 hints are revealed: the target country's capital city, its official currency, and its population range.",
      "20 seats are each named after a real country. Only ONE seat is the safe country.",
      "Lock in the correct country seat within 60 seconds. Bots will choose their seats after the timer expires.",
    ],
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB53YWpNtiqaPUq4utLq7FT699gGqk9WtFbTRKb7Hhp34R9pVtLhTz-Qs2Ahxnvv32bk2rOITDasVJVUwHQmu1Dt8mGMRnJQxwekIKrLb4BIyH5sdSdijRL7p9C0btma-cJ7aSHT8phaazo-LVodgzGWhdlbJlv4LR5KhRX_XCLq2M3qcrywKtN8qkk76qKLvEm19y0ftqqhA4oi7LJoNgTaHXKpETvrGPcUK3ejb0xvLRNmDIyEumpLMheDGW4_3264w"
  },
  {
    id: "stage-2",
    stageNumber: 2,
    code: "STG 02",
    name: "FISHING",
    suit: "SPADES",
    suitSymbol: "♠",
    suitCategory: "PHYSICAL / ENDURANCE",
    subTitle: "THE SONAR ANCHOR",
    tagline: "FEEL THE CURRENT. RESIST THE DEPTH.",
    trialType: "ENDURANCE & REFLEX LOCK",
    clearanceLevel: "LEVEL 2 TACTICAL",
    initialCountdown: 60,
    survivalQuota: "SURVIVE SEARCHLIGHT",
    description: "Operatives are deployed into the lake basin beneath the surveillance airspace. A sweeping sonar searchlight patrols the columns based on aircraft speed telemetry.",
    rules: [
      "Stay submerged underwater to hide from the sweeping searchlight.",
      "Oxygen lasts a maximum of 10 seconds. Surface to breathe only when the searchlight is away from your column.",
      "Surfacing while illuminated results in instant termination."
    ],
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhmBMs_wrwRevn1ytXIOZ6LNtF-xtxTEpK0bfBOjB_AxDHZ3a8uOyzLQMgozeyi9DmrmoA72qqTLB4mmxekDos3E8fRz450G58UTDzZoqsLNIw0SKhwHr4eLxDUcWjA9GJpSq-l32dqxJUqwvZQprrZae2VFN6m9QbGz3t_fIw0kl99q4vh6EFQy3y3LbKlPWCZOHndqQgkzPKWWF0JKrfEnP51xgRCSnKU9dAGAiq7fw2eCkeRkdIjVsOmO4evp8O-w"
  },
  {
    id: "stage-3",
    stageNumber: 3,
    code: "STG 03",
    name: "REDLINE",
    suit: "SPADES",
    suitSymbol: "♠",
    suitCategory: "HEART-RATE & STAMINA",
    subTitle: "TOKYO AIRSPACE BREACH",
    tagline: "SURPASS THE CEILING OR BURN IN THE CONE.",
    trialType: "DYNAMIC OBSTACLE / REDLINE",
    clearanceLevel: "LEVEL 3 OVERRIDE",
    initialCountdown: 60,
    survivalQuota: "SURVIVE WITH 3 LIVES",
    description: "Navigating a 10x10 matrix defense grid. Three sweeping laser columns cycle based on real-time transponder track headings. Each operative starts with 3 lives.",
    rules: [
      "Operatives navigate with directional keys or leap across rows with Space.",
      "Each laser hit costs 1 life out of 3. Losing all lives results in elimination.",
      "Red discharge incinerates any operative remaining in the fired column — Amber = charging warning."
    ],
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhmBMs_wrwRevn1ytXIOZ6LNtF-xtxTEpK0bfBOjB_AxDHZ3a8uOyzLQMgozeyi9DmrmoA72qqTLB4mmxekDos3E8fRz450G58UTDzZoqsLNIw0SKhwHr4eLxDUcWjA9GJpSq-l32dqxJUqwvZQprrZae2VFN6m9QbGz3t_fIw0kl99q4vh6EFQy3y3LbKlPWCZOHndqQgkzPKWWF0JKrfEnP51xgRCSnKU9dAGAiq7fw2eCkeRkdIjVsOmO4evp8O-w"
  },
  {
    id: "stage-4",
    stageNumber: 4,
    code: "STG 04",
    name: "RAPID FIRE",
    suit: "CLUBS",
    suitSymbol: "♣",
    suitCategory: "KNOWLEDGE / INDIVIDUAL",
    subTitle: "ALICE IN BORDERLAND QUIZ",
    tagline: "KNOWLEDGE IS YOUR WEAPON. SPEED IS YOUR SHIELD.",
    trialType: "RAPID FIRE MCQ / INDIVIDUAL",
    clearanceLevel: "LEVEL 4 CIPHER-BRAIN",
    initialCountdown: 30,
    survivalQuota: "TOP 4 SCORERS ADVANCE",
    description: "No more teams. Each operative faces rapid-fire Alice in Borderland questions alone. 30 seconds, multiple-choice questions. Answer fast — wrong answers cost lives. The top 4 scorers advance to the final trial.",
    rules: [
      "Individual round — no teams. Each person answers questions independently.",
      "Correct answer: +1 point. Wrong answer: -1 life (lives carry over from Round 3).",
      "Top 4 scorers advance to Round 5. Reaching 0 lives triggers immediate elimination."
    ],
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB53YWpNtiqaPUq4utLq7FT699gGqk9WtFbTRKb7Hhp34R9pVtLhTz-Qs2Ahxnvv32bk2rOITDasVJVUwHQmu1Dt8mGMRnJQxwekIKrLb4BIyH5sdSdijRL7p9C0btma-cJ7aSHT8phaazo-LVodgzGWhdlbJlv4LR5KhRX_XCLq2M3qcrywKtN8qkk76qKLvEm19y0ftqqhA4oi7LJoNgTaHXKpETvrGPcUK3ejb0xvLRNmDIyEumpLMheDGW4_3264w"
  },
  {
    id: "stage-5",
    stageNumber: 5,
    code: "STG 05",
    name: "DEJA VU",
    suit: "HEARTS",
    suitSymbol: "♥",
    suitCategory: "PSYCHOLOGICAL",
    subTitle: "THE FINAL SURVIVOR PROTOCOL",
    tagline: "ONE PARACHUTE. ONE TRUTH. ZERO COMPASSION.",
    trialType: "MIND CRUCIBLE / FINAL 1",
    clearanceLevel: "LEVEL 5 OMNI ARCHIVE",
    initialCountdown: 120,
    survivalQuota: "ONLY 1 SURVIVOR PROTOCOL",
    description: "The memory crucible. Operatives must memorize the sequential order of live aircraft and reconstruct the original sequence after a shuffle.",
    rules: [
      "Memorize flight order during the initial 30-second window.",
      "Assign each shuffled aircraft back to its exact initial slot.",
      "Any mistake triggers immediate elimination. Repeats in iterations until only 1 survivor remains."
    ],
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhmBMs_wrwRevn1ytXIOZ6LNtF-xtxTEpK0bfBOjB_AxDHZ3a8uOyzLQMgozeyi9DmrmoA72qqTLB4mmxekDos3E8fRz450G58UTDzZoqsLNIw0SKhwHr4eLxDUcWjA9GJpSq-l32dqxJUqwvZQprrZae2VFN6m9QbGz3t_fIw0kl99q4vh6EFQy3y3LbKlPWCZOHndqQgkzPKWWF0JKrfEnP51xgRCSnKU9dAGAiq7fw2eCkeRkdIjVsOmO4evp8O-w"
  }
];
