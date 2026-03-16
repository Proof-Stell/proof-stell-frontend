ProofStell Frontend 🌐
Decentralized Document Verification & Credential Registry on Stellar Soroban

ProofStell is a decentralized platform built on Soroban smart contracts that allows institutions, organizations, and individuals to issue, verify, and manage tamper-proof digital credentials and documents.

Instead of trusting centralized databases, ProofDesk anchors cryptographic proofs of documents on-chain, ensuring authenticity, permanence, and global verifiability.

From academic certificates to employment records and compliance documents, ProofDesk creates a trustless verification infrastructure powered by Stellar
User interface for the ProofStell decentralized document verification platform.

🚀 Key Features
📄 On-Chain Document Proofs

Institutions can register documents by storing cryptographic hashes on-chain via Soroban smart contracts.

Anyone can verify a document’s authenticity by comparing its hash with the blockchain record.

🏫 Institutional Issuers

Verified institutions (schools, companies, NGOs) can issue credentials directly to users’ wallets.

Examples:

University certificates

Employment letters

Training certifications

Compliance approvals

🔐 Wallet-Based Identity

Users connect their Stellar wallets to:

Receive credentials

Share verifiable proofs

Manage issued documents

No usernames or passwords required.

🔎 Instant Verification

Third parties can verify documents in seconds:

Upload the document

Platform hashes the file

Hash is matched with the blockchain record

Result: Valid / Not Found / Revoked

🧾 Revocation Registry

Issuers can revoke credentials if necessary.

Example cases:

Fraudulent certificates

Expired compliance documents

Recalled licenses

The revocation state is stored on-chain for full transparency.

The frontend enables users, institutions, and third parties to interact with the ProofStell ecosystem.

Users can:

• Upload documents
• Verify document authenticity
• View issued credentials
• Connect Stellar wallets

Overview

ProofStell allows anyone to verify documents in seconds.

Instead of trusting centralized databases, ProofStell anchors document hashes on the Stellar blockchain using Soroban smart contracts.

The frontend provides a simple interface to interact with this decentralized infrastructure.

Features

Document Verification

Upload a document to verify whether it has been registered on-chain.

Credential Dashboard

Users can view all credentials issued to their wallet.

Issuer Portal

Organizations can issue credentials to users.

Wallet Authentication

Users connect using Stellar wallets.

Tech Stack

Framework
Next.js

Styling
TailwindCSS

UI Components
ShadCN UI

Blockchain
Soroban RPC

Wallet Integration
Stellar Wallet Kit

Folder Structure
src
│
├── app
│   ├── dashboard
│   ├── verify
│   ├── issuer
│   └── documents
│
├── components
│
├── hooks
│
├── lib
│
├── ui
│
└── styles
How Verification Works

1 User uploads document

2 Frontend hashes the file

3 Hash is sent to backend

4 Backend queries Soroban contract

5 Result is returned to user

Running the Frontend

Install dependencies

npm install

Start development server

npm run dev

Open

http://localhost:3000
Environment Variables
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOROBAN_RPC=
Future Improvements

• Mobile responsive UI
• Credential sharing links
• Public verification explorer
• QR-based document verification
• Issuer dashboards
