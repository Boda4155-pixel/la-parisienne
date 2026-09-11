import { useCallback, useEffect, useState } from "react";

type UseSupabaseQueryOptions<TParams, TData> = {
  fn: (params: TParams) => Promise<TData>;
  params?: TParams;
  skip?: boolean;
};

export const useSupabaseQuery = <TParams, TData>({
  fn,
  params,
  skip = false,
}: UseSupabaseQueryOptions<TParams, TData>) => {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(
    async (overrideParams?: TParams) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fn(overrideParams ?? (params as TParams));
        setData(result);
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [fn, params],
  );

  useEffect(() => {
    if (!skip) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, refetch };
};
