import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SystemProgram, Keypair } from "@solana/web3.js";
import { expect } from "chai";

import { Voting } from "../target/types/voting";

describe("voting", () => {
  // Provider & program
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  console.log(provider.connection.rpcEndpoint);

  const program = anchor.workspace.Voting as Program<Voting>;
  const walletPubkey = provider.wallet.publicKey;

  console.log("Program ID from workspace:", program.programId.toBase58());

  const num = 6;
  const name1 = "Smooth";
  const name2 = "Crunchy";
  const pollId = new anchor.BN(num);

  it("initializes a poll", async () => {
  const description = "Anchor test poll";

  const sig = await program.methods
    .initializePoll(pollId, description)
    .accounts({
      user: walletPubkey,
    })
    .rpc();

  console.log("initialize_poll tx:", sig);

  // derive PDA exactly like Rust
  const pollIdBuf = Buffer.alloc(8);
  pollIdBuf.writeBigUInt64LE(BigInt(pollId.toString()));

  const [pollPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), pollIdBuf],   // must match Rust seeds
    program.programId
  );

  const poll = await program.account.poll.fetch(pollPda);

  expect(poll.pollId.toNumber()).to.equal(num);
  expect(poll.description).to.equal(description);
  expect(poll.candidateCount.toNumber()).to.equal(0);
  expect(poll.pollEnd.toNumber()).to.equal(0);
  expect(poll.pollStart.toNumber()).to.be.greaterThan(0);
});

  it("initializes a candidate", async () => {
    console.log("Program ID from workspace:", program.programId.toBase58());

    const message = "BTC to the moon!";

    const sig = await program.methods
      .initializeCandidate(name1, pollId, message)
      .accounts({
        user: walletPubkey,
      })
      .rpc();

    console.log("initialize_candidate tx:", sig);

    // derive PDA exactly like Rust
    const pollIdBuf = Buffer.alloc(8);
    pollIdBuf.writeBigUInt64LE(BigInt(pollId.toString()));
    const nameBuf = Buffer.from(name1, "utf8");

    const [pollPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("candidate"), pollIdBuf, nameBuf],   // must match Rust seeds
      program.programId
    );

  const candidate = await program.account.candidate.fetch(pollPda);

    expect(candidate.name).to.equal(name1);
    expect(candidate.message).to.equal(message);
    expect(candidate.votes.toNumber()).to.equal(0);
  });

  it("initializes a candidate", async () => {
    console.log("Program ID from workspace:", program.programId.toBase58());

    const message = "BTC to the moon!";

    const sig = await program.methods
      .initializeCandidate(name2, pollId, message)
      .accounts({
        user: walletPubkey,
      })
      .rpc();

    console.log("initialize_candidate tx:", sig);

    // derive PDA exactly like Rust
    const pollIdBuf = Buffer.alloc(8);
    pollIdBuf.writeBigUInt64LE(BigInt(pollId.toString()));
    const nameBuf = Buffer.from(name2, "utf8");

    const [pollPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("candidate"), pollIdBuf, nameBuf],   // must match Rust seeds
      program.programId
    );

  const candidate = await program.account.candidate.fetch(pollPda);

    expect(candidate.name).to.equal(name2);
    expect(candidate.message).to.equal(message);
    expect(candidate.votes.toNumber()).to.equal(0);
  });

  it("voting", async () => {
    console.log("Program ID from workspace:", program.programId.toBase58());

    const sig = await program.methods
      .vote(name1, pollId)
      .accounts({
        user: walletPubkey,
      })
      .rpc();

    console.log("vote tx:", sig);

    // derive PDA exactly like Rust
    const pollIdBuf = Buffer.alloc(8);
    pollIdBuf.writeBigUInt64LE(BigInt(pollId.toString()));

    const [pollPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), pollIdBuf, walletPubkey.toBuffer()],   // must match Rust seeds
      program.programId
    );

  const vote = await program.account.voter.fetch(pollPda);

    expect(vote.hasVoted).to.equal(true);
  });
});
