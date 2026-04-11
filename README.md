# 🌐 ProofStell Frontend

User interface for the ProofStell decentralized document verification platform.

---

## 🌍 Overview

The **ProofStell Frontend** provides a clean and intuitive interface for users, institutions, and third parties to:

* Upload and verify documents
* View issued credentials
* Issue new credentials (for authorized issuers)
* Connect Stellar wallets

It acts as the entry point into the ProofStell ecosystem.

---

## 🚀 Features

### 📄 Document Verification

* Upload a document
* Automatically generate hash
* Check authenticity on-chain

---

### 📊 Credential Dashboard

* View all credentials linked to a wallet
* Track issued and received documents

---

### 🏫 Issuer Portal

* Institutions can issue credentials
* Assign documents to user wallets

---

### 🔐 Wallet Authentication

* Connect using Stellar wallets (e.g. Freighter)
* No usernames or passwords required

---

## 🛠️ Tech Stack

* Next.js
* TailwindCSS
* ShadCN UI
* Stellar Wallet Kit

---

## 📁 Project Structure

```bash
src/
├── app/
│   ├── dashboard/
│   ├── verify/
│   ├── issuer/
│   └── documents/
├── components/
├── hooks/
├── lib/
└── ui/
```

---

## ⚙️ How It Works

1. User uploads a document
2. Frontend hashes the file
3. Sends hash to backend
4. Backend queries smart contract
5. Result displayed to user

---

## 🚀 Getting Started

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

### Open in browser

```
http://localhost:3000
```

---

## 🔐 Environment Variables

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOROBAN_RPC=
NEXT_PUBLIC_STELLAR_NETWORK=testnet
```

---

## 🎯 Goals

* Provide simple UX for blockchain verification
* Enable non-technical users to interact with Web3
* Make document verification fast and intuitive

---

**ProofStell Frontend — Simple access to decentralized verification.**
