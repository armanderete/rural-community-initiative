import { type ResolvedRegister, type Config, useSwitchChain, useAccount, useChainId } from "wagmi";
import {
  type UseSendCallsParameters,
  type UseSendCallsReturnType,
  useWriteContracts
} from "wagmi/experimental";
import { useMemo, useState, type CSSProperties } from "react";
import { type WriteContractsErrorType } from "viem/experimental";
import { TransactionExecutionError } from "viem";
import { arbitrum } from "viem/chains";

export type TransactButtonProps<
  config extends Config = Config,
  context = unknown,
> = UseSendCallsReturnType<config, context>["sendCalls"]["arguments"] & {
  mutation?: UseSendCallsParameters<config, context>["mutation"];
} & { text: string, style?: CSSProperties, className?: string, targetChainId: number };

export function TransactButton<
  config extends Config = ResolvedRegister["config"],
  context = unknown,
>({ mutation, text, targetChainId, style, className, ...rest }: TransactButtonProps<config, context>) {
  const [error, setError] = useState<string | undefined>(undefined);
  const [id, setId] = useState<string | undefined>(undefined);
  const { writeContracts, status } = useWriteContracts({
    mutation: {
      ...mutation,
      onError: (e) => {
        console.log(e);
        if (
          (e as TransactionExecutionError).cause.name ==
          "UserRejectedRequestError"
        ) {
          setError("User rejected request");
        } else {
          setError(e.message);
        }
        mutation.onError(error);
      },
      onSuccess: (id) => {
        setId(id);
        mutation.onSuccess(id);
        console.log("success", id);
      },
    },
  });

  const displayText = useMemo(() => {
    if (status == "pending") {
      setError(undefined);
      setId(undefined);
      return "Confirm in popup";
    }
    return text;
  }, [status, error]);

  return (
    <>
      <button
        style={style ?? {}}
        className={className}
        onClick={() => {
          console.log('Write contracts', rest)
          writeContracts({ ...rest })
        }}
        disabled={status == "pending"}
      >
        {displayText}
      </button>
      {!id && error && <p>error: {error}</p>}
    </>
  );
}