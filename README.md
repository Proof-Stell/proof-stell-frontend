

# 🌐 ProofStell Frontend

User interface for the **ProofStell decentralized document verification platform** built on Stellar.

---

# 🌍 Overview

The **ProofStell Frontend** is the primary entry point into the ProofStell ecosystem. It enables users, institutions, and verifiers to interact with on-chain document credentials in a simple and secure way.

It abstracts blockchain complexity into a smooth user experience for:

* 📄 Document upload & verification
* 🧾 Credential issuance & management
* 🏫 Institutional credential signing
* 🔐 Wallet-based authentication (no passwords required)

All verification logic is anchored on the **Stellar blockchain via Soroban smart contracts**.

---

# 🚀 Features

## 📄 Document Verification System

Users can verify the authenticity of documents in seconds.

**Flow:**

* Upload a document (PDF, image, or text file)
* File is hashed using SHA-256 (client-side)
* Hash is sent to backend / Soroban contract
* On-chain record is checked for integrity match
* Verification result is displayed instantly

**Benefits:**

* Tamper-proof verification
* Instant authenticity check
* Fully auditable on-chain history

---

## 📊 Credential Dashboard

A unified dashboard for all wallet-linked credentials.

**Includes:**

* All issued documents tied to wallet address
* Verification status (valid / revoked / expired)
* Issuer identity (institution or organization)
* Timestamped issuance history
* On-chain transaction references

Users can easily track their digital identity footprint in the ecosystem.

---

## 🏫 Issuer Portal (Institutions)

For verified organizations issuing credentials.

**Capabilities:**

* Issue digital certificates or documents
* Link credentials to wallet addresses
* Revoke or update credentials (if authorized)
* View issuance history and analytics
* Batch issue credentials for multiple users

This transforms institutions into **on-chain trusted issuers**.

---

## 🔐 Wallet Authentication (Stellar Native)

Authentication is fully decentralized.

**Supported Wallets:**

* Freighter Wallet
* Stellar xBull (optional extension support)

**Features:**

* No email/password system
* Signature-based login (SEP-0010 standard)
* Session validation via wallet signature
* Secure wallet identity binding

---

## 🧾 Credential Viewer

Each credential includes:

* Document hash
* Issuer information
* Issuance timestamp
* Verification status
* Blockchain transaction reference
* Optional metadata (course, institution, certification type)

---

## 🔎 Verification Explorer

Public-facing verification tool:

* Paste document hash or upload file
* Instantly check blockchain record
* View issuer authenticity
* Audit credential lifecycle

---

# 🛠️ Tech Stack

| Layer         | Technology                       |
| ------------- | -------------------------------- |
| Framework     | Next.js (App Router)             |
| Styling       | TailwindCSS                      |
| UI System     | ShadCN UI                        |
| Blockchain    | Stellar / Soroban                |
| Wallet Auth   | Stellar Wallet Kit (Freighter)   |
| State Mgmt    | React Query / Zustand (optional) |
| File Handling | Client-side hashing (SHA-256)    |

---

# 📁 Project Structure

```bash
src/
├── app/
│   ├── dashboard/        # User credential dashboard
│   ├── verify/           # Document verification page
│   ├── issuer/           # Institution issuance portal
│   ├── documents/        # Credential detail views
│   └── layout.tsx
│
├── components/
│   ├── auth/             # Wallet authentication components
│   ├── dashboard/        # Stats, cards, lists
│   ├── verify/           # Upload + verification UI
│   ├── issuer/           # Issuer tools
│   └── shared/           # Reusable UI components
│
├── hooks/                # Custom React hooks
├── lib/                  # API clients, helpers, blockchain utils
├── utils/                # Hashing, formatting, validators
└── ui/                   # Base UI components (ShadCN)
```

---

# ⚙️ System Architecture

```text
User
 │
 ▼
Frontend (Next.js)
 │  - File upload
 │  - SHA-256 hashing
 │
 ▼
Backend API
 │  - Validates request
 │  - Queries Stellar / Soroban
 │
 ▼
Stellar Blockchain
 │  - Stores document hashes
 │  - Verifies credential integrity
 │
 ▼
Response returned
 │
 ▼
Frontend displays verification result
```

---

# 🔁 How It Works

### 📄 Document Verification Flow

1. User uploads a document
2. Frontend generates cryptographic hash
3. Hash is sent to backend API
4. Backend checks Soroban smart contract
5. Contract returns match / mismatch
6. UI displays verification result

---

### 🏫 Credential Issuance Flow

1. Institution logs in via wallet
2. Uploads credential metadata
3. Backend stores IPFS / metadata hash
4. Soroban contract records issuance
5. Credential becomes publicly verifiable

---

# 🚀 Getting Started

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Run Development Server

```bash
npm run dev
```

---

## 3. Open Application

```
http://localhost:3000
```

---

# 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in the values. The app validates environment variables at startup but **does not crash** when required values are missing — it starts in a degraded state with console warnings.

### Required

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Soroban RPC endpoint (e.g. `https://soroban-testnet.stellar.org`) |
| `NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE` | Stellar network passphrase |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | Stellar Horizon endpoint |
| `NEXT_PUBLIC_PROOFSTELL_CONTRACT_ID` | ProofStell contract address |

Missing any of these will log a warning and disable blockchain features.

### Optional

| Variable | Default / Fallback |
| --- | --- |
| `NEXT_PUBLIC_ISSUER_CONTRACT_ID` | `undefined` |
| `NEXT_PUBLIC_WALLET_PROVIDERS` | Empty (no wallet providers) |
| `NEXT_PUBLIC_API_BASE_URL` | Falls back to mock data |
| `NEXT_PUBLIC_API_KEY` | None |
| `NEXT_PUBLIC_APP_ENV` | `undefined` |
| `NEXT_PUBLIC_LOG_LEVEL` | `undefined` |
| `NEXT_PUBLIC_ENABLE_MOCK_DATA` | `false` |

Example:

```env
# copy .env.example -> .env.local and edit
```

---

# 🎯 Goals

* Make blockchain verification **invisible to users**
* Provide a **simple Web2-like UX for Web3 credentials**
* Enable institutions to issue **tamper-proof digital documents**
* Build a **global verification layer for credentials**

---

# 🧠 Design Principles

* ⚡ Fast UX — instant verification feedback
* 🔐 Trustless — no centralized authority for validation
* 🌍 Accessible — usable by non-technical users
* 📱 Responsive — works on mobile & desktop
* 🧩 Modular — easy to extend with new credential types

---

# 🤝 Contribution

We welcome contributions from developers, designers, and blockchain enthusiasts.

### How to contribute:

```bash
git checkout -b feature/your-feature
npm install
npm run dev
```

* Follow consistent component structure
* Keep UI reusable and modular
* Ensure all blockchain calls are tested
* Link PRs to issues

---

# 📜 License

MIT License — open-source and community-driven.

---

# 🌐 ProofStell Frontend

> Simple access to decentralized verification.
> Built for trust. Powered by Stellar.

---
