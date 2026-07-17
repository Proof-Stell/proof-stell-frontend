import { env } from "../config/environment";

type JsonRpcResponse = {
  jsonrpc: string;
  id: number | string;
  result?: unknown;
  error?: unknown;
};

class SorobanService {
  get rpcUrl(): string {
    return (env.NEXT_PUBLIC_SOROBAN_RPC_URL as string | undefined) ?? "";
  }

  get networkPassphrase(): string {
    return (env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE as string | undefined) ?? "";
  }

  async rpc(method: string, params: unknown[] = []): Promise<unknown> {
    if (!this.rpcUrl) {
      throw new Error(
        "NEXT_PUBLIC_SOROBAN_RPC_URL is not set. Cannot make RPC calls.",
      );
    }
    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const json = (await res.json()) as JsonRpcResponse;
    if (json.error) throw new Error(JSON.stringify(json.error));
    return json.result;
  }

  getHorizonUrl() {
    return (env.NEXT_PUBLIC_STELLAR_HORIZON_URL as string | undefined) ?? "";
  }
}

export const soroban = new SorobanService();
