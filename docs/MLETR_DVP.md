# mLETR DvP Settlement

Agentic Delivery-versus-Payment (DvP) settlement connecting tokenised trade documents (TrustVC) with stablecoin payments under the UNCITRAL Model Law on Electronic Transferable Records (mLETR).

## Overview

The mLETR DvP module orchestrates atomic settlement between:

1. **Delivery leg** — Transfer of electronic transferable record (eTR) control via TrustVC token registry
2. **Payment leg** — Stablecoin (USDC/USDT) payment held in escrow until document transfer completes

An agentic coordinator validates mLETR compliance, extracts settlement terms from AI-parsed document content (Extend.ai), and drives the settlement state machine.

## Settlement Flow

```
Create Settlement → Agent Review → Await Payment → Confirm Payment
       → Transfer Document (TrustVC) → Release Payment → Settled
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/mletr-dvp/:accountId/settlements` | Create DvP settlement |
| GET | `/api/mletr-dvp/:accountId/settlements` | List settlements |
| GET | `/api/mletr-dvp/:accountId/settlements/:id` | Get settlement details |
| POST | `/api/mletr-dvp/:accountId/settlements/:id/initiate` | Run agentic review |
| GET | `/api/mletr-dvp/:accountId/settlements/:id/payment-instructions` | Get escrow payment details |
| POST | `/api/mletr-dvp/:accountId/settlements/:id/confirm-payment` | Verify on-chain payment |
| POST | `/api/mletr-dvp/:accountId/settlements/:id/execute` | Execute DvP (transfer + release) |
| POST | `/api/mletr-dvp/:accountId/settlements/:id/cancel` | Cancel pending settlement |

## Configuration

Add to `.env`:

```env
DVP_ESCROW_WALLET_ADDRESS=0x...
DVP_ESCROW_WALLET_KEY=0x...
STABLECOIN_USDC_CONTRACT_ADDRESS=0x...
STABLECOIN_USDC_DECIMALS=6
```

## mLETR Compliance

- Bill of Lading is classified as **TRANSFERABLE** (electronic transferable record)
- Documents must be **Issued** with TrustVC merkle root and on-chain mint
- AI-parsed document content (Extend.ai) auto-populates settlement amount and parties
- Agent validates reliability, integrity, and control requirements per mLETR

## Agent Architecture

The `DvpAgentService` uses a tool-based decision loop:

| Tool | Purpose |
|------|---------|
| `VALIDATE_MLETR_COMPLIANCE` | Check eTR requirements |
| `EXTRACT_SETTLEMENT_TERMS` | Parse amount/parties from AI content |
| `REQUEST_PAYMENT` | Direct buyer to escrow |
| `CONFIRM_PAYMENT` | Verify on-chain tx |
| `TRANSFER_DOCUMENT` | Execute TrustVC holder transfer |
| `RELEASE_FUNDS` | Send stablecoin to seller |

Designed for extension with LLM providers via the same tool interface.
