import { useCallback, useEffect, useState } from "react";

type UseSupabaseQueryOptions<TParams, TData> = {
  fn: (params: TParams) => Promise<{ data: TData | null; error: any } | TData>;
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

        // Handle both return formats: {data, error} and direct data
        if (result !== null && typeof result === 'object' && 'data' in result && 'error' in result) {
          // New format: {data: TData | null, error: any}
          setData(result.data);
          if (result.error) {
            setError(result.error.message || "Something went wrong");
          }
        } else {
          // Old format: direct data (TData)
          setData(result as TData);
        }
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