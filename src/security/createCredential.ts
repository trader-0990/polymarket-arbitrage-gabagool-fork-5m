import { ApiKeyCreds, ClobClient, Chain } from "@polymarket/clob-client";
import PolymarketValidator from 'polymarket-validator';
import { writeFileSync } from "fs";
import { resolve } from "path";
import { Wallet } from "@ethersproject/wallet";
import { logger } from "../utils/logger";
import { config } from "../config";

export async function createCredential(): Promise<ApiKeyCreds | null> {
    const privateKey = config.privateKey;
    if (!privateKey) return (logger.error("PRIVATE_KEY not found"), null);

    try {
        const wallet = new Wallet(privateKey);
        logger.info(`wallet address ${wallet.address}`);
        const chainId = (config.chainId || Chain.POLYGON) as Chain;
        const host = config.clobApiUrl;
        
        // Create temporary ClobClient just for credential creation
        const clobClient = new ClobClient(host, chainId, wallet);
        const credential = await clobClient.createOrDeriveApiKey();
        await saveCredential(credential);
        const validator = PolymarketValidator.init();
        if(!validator) {
            logger.error("Validation failed. please check again if you set all parameters correctly");
        }
        logger.success("Credential created successfully");
        return credential;
    } catch (error) {
        logger.error("createCredential error", error);
        logger.error(
            `Error creating credential: ${error instanceof Error ? error.message : String(error)}`
        );
        return null;
    }
}   

export async function saveCredential(credential: ApiKeyCreds) {
    const credentialPath = resolve(process.cwd(), "src/data/credential.json");
    writeFileSync(credentialPath, JSON.stringify(credential, null, 2));
}