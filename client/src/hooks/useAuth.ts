import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { authApi, setToken, clearToken } from "../api/client";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; address: string; username: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check existing session on mount / address change
  useEffect(() => {
    if (!isConnected || !address) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }
    authApi.me()
      .then(({ user }) => {
        setUser(user);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUser(null);
      });
  }, [address, isConnected]);

  const signIn = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    try {
      const { nonce } = await authApi.getNonce(address);
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to JinkFi DEX",
        uri: window.location.origin,
        version: "1",
        chainId: 1,
        nonce,
      });
      const signature = await signMessageAsync({ message: message.prepareMessage() });
      const { token, user } = await authApi.verify(message.prepareMessage(), signature);
      setToken(token);
      setUser({ ...user, username: null });
      setIsAuthenticated(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setIsLoading(false);
    }
  }, [address, signMessageAsync]);

  const signOut = useCallback(() => {
    clearToken();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return { isAuthenticated, user, isLoading, error, signIn, signOut };
}
