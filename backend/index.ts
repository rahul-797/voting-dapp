import express from "express";
import cors from "cors";

import {
  ActionGetResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";

import {
  AnchorProvider,
  Program,
  BN,
} from "@coral-xyz/anchor";

import type { Voting } from "../target/types/voting";
import idl from "../target/idl/voting.json";

// ----------------------
// Solana / Anchor setup
// ----------------------

// Local validator
const RPC_URL = "http://127.0.0.1:8899";
const connection = new Connection(RPC_URL, "confirmed");

// Program ID from IDL metadata (or hardcode if missing)
const PROGRAM_ID = new PublicKey(
  (idl as any).metadata?.address ?? "CkANkkC2LgoHpq3jLp5sgiGvxrEJEA76NZjS2NA8w8fr"
);

// Dummy wallet – we only build unsigned transactions,
// the user's wallet will sign them in the client.
const dummyWallet = {
  publicKey: PublicKey.default,
  signTransaction: async (tx: Transaction) => tx,
  signAllTransactions: async (txs: Transaction[]) => txs,
};

// Provider required by Anchor Program
const provider = new AnchorProvider(
  connection,
  dummyWallet as any,
  AnchorProvider.defaultOptions()
);

// Anchor program instance
const program = new Program<Voting>(idl as Voting, { connection });

// ----------------------
// Express app
// ----------------------
const app = express();
app.use(cors());
app.use(express.json());

// ----------------------
// GET /api/vote  (Action metadata)
// ----------------------
app.get("/api/vote", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const actionMetadata: ActionGetResponse = {
    icon:
      "https://zestfulkitchen.com/wp-content/uploads/2021/09/Peanut-butter_hero_for-web-2.jpg",
    title: "Vote for your favorite type of peanut butter!",
    description: "Vote between crunchy and smooth peanut butter.",
    label: "Vote",
    links: {
      actions: [
        {
          label: "Vote for Crunchy",
          href: `${baseUrl}/api/vote?candidate=Crunchy`,
          type: "message",
        },
        {
          label: "Vote for Smooth",
          href: `${baseUrl}/api/vote?candidate=Smooth`,
          type: "message",
        },
      ],
    },
  };

  res.set(ACTIONS_CORS_HEADERS).json(actionMetadata);
});

// ----------------------
// OPTIONS /api/vote (preflight)
// ----------------------
app.options("/api/vote", (req, res) => {
  res.set(ACTIONS_CORS_HEADERS).sendStatus(200);
});

// ----------------------
// POST /api/vote (build transaction)
// ----------------------
app.post("/api/vote", async (req, res) => {
  try {
    const candidate = req.query.candidate as string | null;

    if (candidate !== "Crunchy" && candidate !== "Smooth") {
      return res
        .status(400)
        .set(ACTIONS_CORS_HEADERS)
        .send("Invalid candidate");
    }

    const body = req.body as ActionPostRequest<string>;

    if (!body.account) {
      return res
        .status(400)
        .set(ACTIONS_CORS_HEADERS)
        .send("Missing account");
    }

    let voter: PublicKey;
    try {
      voter = new PublicKey(body.account);
    } catch {
      return res
        .status(400)
        .set(ACTIONS_CORS_HEADERS)
        .send("Invalid account");
    }

    const pollId = new BN(1); // same as your original code

    // Build instruction using your Anchor program
    const ix = await program.methods
      .vote(candidate, pollId)
      .accounts({
        // this must match your #[derive(Accounts)] names
        user: voter,
        // if your instruction requires more accounts, add them:
        // voter: voterPda,
        // candidate: candidatePda,
        // poll: pollPda,
      })
      .instruction();

    const blockhash = await connection.getLatestBlockhash();

    const tx = new Transaction({
      feePayer: voter,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }).add(ix);

    const actionResponse = await createPostResponse({
      fields: {
        type: "transaction",
        transaction: tx,
        // message: `Voting for ${candidate} in poll #1`, // optional
      },
    });

    res.set(ACTIONS_CORS_HEADERS).json(actionResponse);
  } catch (e) {
    console.error(e);
    res.status(500).set(ACTIONS_CORS_HEADERS).send("Internal error");
  }
});

// ----------------------
// Start server
// ----------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Express Actions backend listening on http://localhost:${PORT}`);
});
