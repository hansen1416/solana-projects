import {
	AccountInfo,
	Connection,
	PublicKey,
	SystemProgram,
	Transaction,
	TransactionInstruction,
	TransactionSignature,
	RpcResponseAndContext,
	SignatureResult,
} from "@solana/web3.js";
import { WalletAdapter } from "../interfaces/index";

export async function createFromSeed(
	conn: Connection,
	walletAdapter: WalletAdapter,
	programId: PublicKey,
	seed: string,
	space: number
): Promise<AccountInfo<Buffer>> {
	const lamports = await conn.getMinimumBalanceForRentExemption(space);

	/**
	 * Derive a public key from another key, a seed, and a program ID.
	 * The program ID will also serve as the owner of the public key, giving
	 * it permission to write data to the account.
	 */
	// !!! create an publickey that is owned by `programId`, and associate with the `wallet.publicKey`
	// GROUP_SEED is some fixed value
	// e.g. in our case, we can create an account from user publick key, program id and group name
	// this way, we'd have an entrypoint account we fetch the initial data of a certain user,
	// the initial data is going to be a hash, the actual content is stored in IPFS/Arweave
	const derivedPubKey: PublicKey = await PublicKey.createWithSeed(
		walletAdapter.publicKey!,
		seed,
		programId
	);

	let derivedAccountInfo: AccountInfo<Buffer> | null =
		await conn.getAccountInfo(derivedPubKey);
	// if the derived account is created already
	// we read its account info and return
	// the owner of this account is the programId
	if (derivedAccountInfo) {
		return new Promise((resolve) => {
			resolve(derivedAccountInfo as AccountInfo<Buffer>);
		});
	}

	// !!! when we have a pubkey associate user's pubkey, program, and groupname,
	// we create a account by this pubkey,
	// the source code is at `CreateAccountWithSeedParams` in web3js
	// basePubkey: Base public key to use to derive the address of the created account. Must be the same as the base key used to create newAccountPubkey
	// fromPubkey: The account that will transfer lamports to the created account
	// newAccountPubkey: the pub address derived from user's pubkey, programid and seed
	// lamports:
	// programId:
	// seed: Seed to use to derive the address of the created account. Must be the same as the seed used to create newAccountPubkey
	// spae: Amount of space in bytes to allocate to the created account, the space is immutable, and cost money
	const instruction: TransactionInstruction =
		SystemProgram.createAccountWithSeed({
			fromPubkey: walletAdapter.publicKey!,
			basePubkey: walletAdapter.publicKey!,
			seed: seed,
			newAccountPubkey: derivedPubKey,
			lamports: lamports,
			space: space,
			programId: programId,
		});

	const transaction = new Transaction();

	transaction.add(instruction);
	transaction.feePayer = walletAdapter.publicKey!;
	// Fetch a recent blockhash from the cluster, deprecated
	// use getLatestBlockhash
	let hash = await conn.getRecentBlockhash();
	transaction.recentBlockhash = hash.blockhash;

	// console.log(transaction);

	try {
		console.log("start signAndSendTransaction");
		// how did it sign transaction?
		// https://github.com/project-serum/sol-wallet-adapter/blob/master/src/index.ts
		// it is not using private key
		// pay more attention to this, add as much log as I can
		let signature: string = await walletAdapter.signAndSendTransaction(
			conn,
			transaction
		);
		console.log("signed transaction", signature);
		// Commitment: "processed" | "confirmed" | "finalized" | "recent" | "single" | "singleGossip" | "root" | "max"
		let result: RpcResponseAndContext<SignatureResult> =
			await conn.confirmTransaction(signature, "singleGossip");
		console.log("new chat account created", result);
		// account created, return account info
		let derivedAccountInfo: AccountInfo<Buffer> | null =
			await conn.getAccountInfo(derivedPubKey);

		return new Promise((resolve) => {
			resolve(derivedAccountInfo as AccountInfo<Buffer>);
		});
	} catch (err) {
		console.log("signAndSendTransaction error", err);
		throw err;
	}
}