import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "./useDebounce";

interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function useAsyncFieldValidation(
  fieldName: string,
  value: string,
  validateFn: (v: string) => Promise<ValidationResult>
) {
  const debounced = useDebounce(value, 500);

  const { data: result, isPending: isValidating } = useQuery({
    queryKey: ["async-validation", fieldName, debounced],
    queryFn: () => validateFn(debounced),
    enabled: debounced.length >= 3,
    staleTime: 60 * 1000,
  });

  return { isValidating, result };
}
