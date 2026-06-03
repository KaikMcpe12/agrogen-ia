// react-imask wrapper compatível com exactOptionalPropertyTypes
import { IMaskInput } from "react-imask";

interface MaskedInputProps {
  mask: string;
  label?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  hint?: string | undefined;
  placeholder?: string | undefined;
  value?: string | undefined;
  onAccept?: ((value: string) => void) | undefined;
  onBlur?: (() => void) | undefined;
  id?: string | undefined;
  disabled?: boolean | undefined;
}

const baseClass =
  "w-full px-3 py-[10px] rounded-[10px] border text-[14px] text-ink bg-surface " +
  "placeholder:text-ink-4 transition-all outline-none " +
  "focus:border-green-700 focus:ring-[3px] focus:ring-green-700/18 " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-beige";

export function MaskedInput({
  mask,
  label,
  error,
  required,
  hint,
  placeholder,
  value = "",
  onAccept,
  onBlur,
  id,
  disabled,
}: MaskedInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const borderClass = error ? "border-danger focus:ring-danger/20" : "border-line";

  // Cast para any para contornar restrições de exactOptionalPropertyTypes com IMaskInput
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iMaskProps: Record<string, any> = {
    id: inputId,
    mask,
    value,
    className: `${baseClass} ${borderClass}`,
    style: { minHeight: 44 },
  };
  if (onAccept !== undefined) iMaskProps.onAccept = onAccept;
  if (onBlur !== undefined) iMaskProps.onBlur = onBlur;
  if (placeholder !== undefined) iMaskProps.placeholder = placeholder;
  if (disabled !== undefined) iMaskProps.disabled = disabled;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-ink-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <IMaskInput {...iMaskProps} />
      {hint && !error && <p className="text-[12px] text-ink-3">{hint}</p>}
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
