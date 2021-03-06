import {
	AccountMeta,
	Connection,
	PublicKey,
	SignatureResult,
	TransactionInstruction,
	Transaction,
} from "@solana/web3.js";
import { WalletAdapter } from "../interfaces/index";
import { walletSignAndConfirmTransaction } from "./transaction";

export async function likePost(
	conn: Connection,
	walletAdapter: WalletAdapter,
	accountKeys: PublicKey[],
	programId: PublicKey
): Promise<SignatureResult> {
	const keys: AccountMeta[] = [];

	for (let indx in accountKeys) {
		if (indx == "0") {
			keys.push({
				pubkey: accountKeys[indx],
				isSigner: false,
				isWritable: true,
			});
		} else {
			keys.push({
				pubkey: accountKeys[indx],
				isSigner: false,
				isWritable: true,
			});
		}
	}

	const instruction = new TransactionInstruction({
		keys: keys,
		programId,
	});

	const transaction = new Transaction().add(instruction);

	transaction.feePayer = walletAdapter.publicKey!;
	// transaction.feePayer = accountKeys[0];

	// console.log(transaction);

	// return new Promise(() => {});

	return walletSignAndConfirmTransaction(conn, walletAdapter, transaction);
}
