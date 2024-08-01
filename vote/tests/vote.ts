import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Vote } from "../target/types/vote";

describe("vote", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Vote as Program<Vote>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
