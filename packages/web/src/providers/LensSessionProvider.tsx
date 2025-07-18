import { createContext, FC, ReactNode, useCallback, useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useModal } from "connectkit";
import {
  Account,
  AccountAvailable,
  AuthenticatedUser,
  evmAddress,
  PublicClient,
  SessionClient,
  useAuthenticatedUser,
  useLogin,
  useLogout,
  useSessionClient,
} from "@lens-protocol/react";
import { fetchAccount, fetchAccountsAvailable } from "@lens-protocol/client/actions";
import config from "@/src/config";

export interface LensSessionContextType {
  /**
   * The connected wallet address
   */
  walletAddress: `0x${string}` | undefined;

  /**
   * The authenticated Lens user
   */
  lensUser: AuthenticatedUser | undefined | null;

  /**
   * The Lens account for the authenticated user
   */
  account: Account | undefined | null;

  /**
   * A list of Lens accounts owned or managed by the authenticated user
   */
  accountsAvailable: AccountAvailable[];

  /**
   * The Lens session client
   */
  client: SessionClient | PublicClient;

  isConnecting: boolean;

  loginLoading: boolean;

  logoutLoading: boolean;

  sessionLoading: boolean;

  lensUserLoading: boolean;

  accountLoading: boolean;

  /**
   * An error that occurred during the session lifecycle
   */
  error: Error | null;

  /**
   * Open the ConnectKit modal to connect a wallet
   */
  connectWallet: () => void;

  /**
   * Open the ConnectKit modal to disconnect the wallet
   */
  disconnectWallet: () => void;

  /**
   * Authenticate with Lens Protocol
   * @param account The account to authenticate with
   */
  logIn: (account: Account) => Promise<void>;

  /**
   * End the Lens session
   */
  logOut: () => Promise<void>;

  /**
   * Fetch account data and available Lens accounts
   */
  refresh: () => Promise<void>;
}

export const LensSessionContext = createContext<LensSessionContextType | undefined>(undefined);

interface LensSessionProviderProps {
  children: ReactNode;
}

const LensSessionProvider: FC<LensSessionProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<Account | undefined | null>(undefined);
  const [accountsAvailable, setAccountsAvailable] = useState<AccountAvailable[]>([]);
  const [accountLoading, setAccountLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const { data: walletClient } = useWalletClient({
    chainId: config.lens.chain.id,
  });
  const { address: walletAddress, isConnecting } = useAccount();
  const { setOpen: setConnectModalOpen } = useModal();

  const { execute: executeLogin, loading: loginLoading, error: loginError } = useLogin();
  const { execute: executeLogout, loading: logoutLoading, error: logoutError } = useLogout();
  const { data: sessionClient, loading: sessionLoading, error: sessionError } = useSessionClient();
  const { data: lensUser, loading: lensUserLoading } = useAuthenticatedUser();

  const lensClient = PublicClient.create({
    environment: config.lens.environment,
  });

  const updateAccount = useCallback(async () => {
    if (lensUser === undefined) return;
    if (lensUser === null) {
      setAccount(null);
      setAccountLoading(false);
      return;
    }
    setAccountLoading(true);
    const accountResult = await fetchAccount(lensClient, {
      address: lensUser.address,
    });
    if (accountResult.isErr()) {
      console.error("Error fetching account", accountResult.error);
      setAccount(null);
      setError(new Error("Error getting account details"));
    } else {
      setAccount(accountResult.value);
    }
    setAccountLoading(false);
  }, [lensClient, lensUser]);

  const updateAccountsAvailable = useCallback(
    async (address: string | undefined = lensUser?.signer) => {
      if (!address) {
        setAccountsAvailable([]);
        return;
      }

      const accountsRes = await fetchAccountsAvailable(lensClient, {
        managedBy: evmAddress(address),
      });

      if (accountsRes.isErr()) {
        setError(new Error("Error fetching managed accounts"));
        setAccountsAvailable([]);
        console.error("Error fetching managed accounts");
        return;
      }

      const accounts = accountsRes.value;
      if (!accounts?.items) {
        setError(new Error("No accounts available"));
        setAccountsAvailable([]);
        console.error("No accounts available");
        return;
      }

      setAccountsAvailable([...accounts.items]);
    },
    [lensUser?.signer],
  );

  useEffect(() => {
    if (accountLoading || account || lensUser === undefined) return;
    updateAccount();
  }, [accountLoading, lensUser, account, updateAccount]);

  useEffect(() => {
    updateAccountsAvailable(walletAddress).catch(e => {
      console.error("Error fetching available accounts:", e);
      setError(e);
    });
  }, [walletAddress, updateAccountsAvailable]);

  useEffect(() => {
    if (loginError) {
      setError(loginError);
    } else if (sessionError) {
      setError(sessionError);
    } else if (logoutError) {
      setError(logoutError);
    }
  }, [loginError, sessionError, logoutError]);

  const connectWallet = () => {
    setConnectModalOpen(true);
  };

  const disconnectWallet = () => {
    setConnectModalOpen(true);
  };

  const logIn = async (account: Account) => {
    if (sessionClient?.isSessionClient()) {
      const switchResult = await sessionClient.switchAccount({
        account: account.address,
      });
      if (switchResult.isOk()) {
        const accountResult = await fetchAccount(sessionClient, {
          address: account.address,
        });
        if (accountResult.isOk() && accountResult.value) {
          setAccount(accountResult.value);
        } else {
          setAccount(account);
        }
        return;
      }
    }

    if (!walletClient || !walletAddress) {
      console.error("No wallet available");
      setError(new Error("No wallet available"));
      return;
    }

    try {
      const result = await executeLogin({
        ...(account.owner === walletAddress
          ? {
              accountOwner: {
                owner: evmAddress(walletAddress),
                account: evmAddress(account.address),
                app: process.env.NEXT_PUBLIC_LENS_FAMEISH_APP_ADDRESS,
              },
            }
          : {
              accountManager: {
                manager: evmAddress(walletAddress),
                account: evmAddress(account.address),
                app: process.env.NEXT_PUBLIC_LENS_FAMEISH_APP_ADDRESS,
              },
            }),
        signMessage: async (message: string) => {
          return walletClient.signMessage({ account: walletAddress, message });
        },
      });

      if (result.isErr()) {
        console.error("Login error:", result.error);
        throw result.error;
      }

      const accountResult = await fetchAccount(lensClient, {
        address: account.address,
      });
      if (accountResult.isOk() && accountResult.value) {
        setAccount(accountResult.value);
      } else {
        setAccount(account);
      }

      setError(null);
    } catch (error) {
      console.error("Login failed:", error);
      if (error instanceof Error) {
        setError(error);
      } else {
        setError(new Error("Login failed"));
      }
    } finally {
      // sleep for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  };

  const logOut = async () => {
    const logoutRes = await executeLogout();
    if (logoutRes.isErr()) {
      setError(logoutRes.error);
      console.error("Logout error:", logoutRes.error);
      window.localStorage.clear();
    }
    setAccount(null);
    setAccountsAvailable([]);
  };

  const refresh = async () => {
    if (!walletAddress) return;
    await updateAccount();
    await updateAccountsAvailable();
  };

  return (
    <>
      <LensSessionContext.Provider
        value={{
          walletAddress,
          lensUser,
          account,
          accountsAvailable,
          client: sessionClient ?? lensClient,
          isConnecting,
          loginLoading,
          logoutLoading,
          sessionLoading,
          lensUserLoading,
          accountLoading,
          error,
          connectWallet,
          disconnectWallet,
          logIn,
          logOut,
          refresh,
        }}
      >
        {children}
      </LensSessionContext.Provider>
    </>
  );
};

export { LensSessionProvider };
