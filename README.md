
# 🚀 Local Development & Testing (Solana + Anchor)

This project uses **Anchor** and the **Solana Test Validator** for local development, deployment, and testing.

---

## 🔧 1. Initial Setup

```bash
git clone https://github.com/rahul-797/voting-dapp.git
```

---

Configure the Solana CLI to use the **local validator** and build the program:

```bash
solana config set -ul
anchor build
```

## If manually running validator (recommended)
```bash
solana-test-validator --reset
anchor deploy
anchor test --skip-local-validator
```
## Direct test
(It will start local validator each time from scratch, so can't work with previous data)
```bash
anchor test
```
