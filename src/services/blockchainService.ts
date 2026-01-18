import { suiClient } from "../utils/suiClient";
import { REGISTRY_ID } from "../constants/blockchain";
import { bcs } from "@mysten/sui/bcs";

// We assume these fields exist based on the Move contract
// VerifyMeRegistry { issuers: Table<u64, IssuerRecord>, ... }
// We need to know the structure to decode, or just use the JSON response.

export const blockchainService = {
  async getRegistry() {
    if (!REGISTRY_ID || REGISTRY_ID.includes("YOUR_REGISTRY_ID")) {
      console.warn("Registry ID not set in constants/blockchain.ts");
      return null;
    }
    const res = await suiClient.getObject({
      id: REGISTRY_ID,
      options: { showContent: true },
    });
    const content = res.data?.content as any;
    return content?.fields;
  },

  async getAllIssuers() {
    const registry = await this.getRegistry();
    if (!registry) return [];

    const nextId = parseInt(registry.next_issuer_id);
    const issuersTableId = registry.issuers.fields.id.id; // Table ID
    
    // Naively fetch all issuers 1..nextId-1
    const promises = [];
    for (let i = 1; i < nextId; i++) {
        promises.push(
            suiClient.getDynamicFieldObject({
                parentId: issuersTableId,
                name: { type: "u64", value: i.toString() }
            })
        );
    }

    const results = await Promise.all(promises);
    return results
        .filter(r => r.data && r.data.content)
        .map(r => (r.data?.content as any).fields.value.fields);
  },

  async getIssuerByAddress(address: string) {
    const issuers = await this.getAllIssuers();
    return issuers.find((i: any) => i.issuer_address === address);
  },
  
  async getCredentials() {
    const registry = await this.getRegistry();
    if (!registry) return [];

    const nextId = parseInt(registry.next_credential_id);
    const tableId = registry.credentials.fields.id.id;

    const promises = [];
    for (let i = 1; i < nextId; i++) {
        promises.push(
            suiClient.getDynamicFieldObject({
                parentId: tableId,
                name: { type: "u64", value: i.toString() }
            })
        );
    }
    
    const results = await Promise.all(promises);
    return results
        .filter(r => r.data && r.data.content)
        .map(r => (r.data?.content as any).fields.value.fields);
  }
};
