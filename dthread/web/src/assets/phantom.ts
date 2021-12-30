import { PublicKey } from "@solana/web3.js";

interface connectionResponse {
	publicKey: PublicKey;
}

export default class PhantomWallet {
	provider: any;
	pubkey?: string;

	constructor() {
		if ("solana" in window) {
			const provider = window.solana;
			if (provider.isPhantom) {
				this.provider = provider;
			} else {
				throw new Error("no phantom provider");
			}
		} else {
			throw new Error("no provider");
		}
	}

	async connect(): Promise<PublicKey> {
		/**
		 * After a web application connects to Phantom for the first time it becomes trusted,
		 * and it is possible for the application to automatically connect to Phantom on subsequent visits,
		 * or page refreshes. This is often called "eagerly connecting".
		 * To implement this, pass `onlyIfTrusted: true` to connect().
		 */

		const resp: connectionResponse = await this.provider.connect({
			onlyIfTrusted: import.meta.env.PROD,
		});

		return new Promise<PublicKey>((resolve) => {
			resolve(resp.publicKey);
		});
	}
}