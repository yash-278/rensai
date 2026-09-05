import { useEffect, useState, type ReactNode } from 'react';
import { useRecoilState, type RecoilState } from 'recoil';
import { Input } from '@houdoku/ui/components/Input';
import { Switch } from '@houdoku/ui/components/Switch';

export type Preference = {
  id: string;
  section: string;
  group: string;
  title: string;
  description?: string;
  keywords?: string;
  control: ReactNode;
  wide?: boolean;
};
export function TogglePreference({
  id,
  state,
  disabled = false,
}: { id: string; state: RecoilState<boolean>; disabled?: boolean }) {
  const [value, setValue] = useRecoilState(state);
  return (
    <Switch
      id={id}
      aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-description`}
      checked={value}
      disabled={disabled}
      onCheckedChange={setValue}
    />
  );
}
export function togglePreference(
  id: string,
  section: string,
  group: string,
  title: string,
  description: string,
  state: RecoilState<boolean>,
): Preference {
  return {
    id,
    section,
    group,
    title,
    description,
    control: <TogglePreference id={id} state={state} />,
  };
}
export function NumberPreference({
  id,
  value,
  onChange,
  min,
  max,
  disabled = false,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max?: number;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setDraft(String(value));
    setInvalid(false);
  }, [value]);
  const commit = () => {
    const next = Number(draft);
    if (
      !draft.trim() ||
      !Number.isInteger(next) ||
      next < min ||
      (max !== undefined && next > max)
    ) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onChange(next);
  };
  return (
    <div className="settings-number">
      <Input
        id={id}
        aria-labelledby={`${id}-label`}
        type="number"
        min={min}
        max={max}
        value={draft}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : `${id}-description`}
        onChange={(e) => {
          setDraft(e.target.value);
          setInvalid(false);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setDraft(String(value));
            setInvalid(false);
          }
        }}
      />
      {invalid && (
        <span id={`${id}-error`} role="alert">
          Enter a whole number {max ? `from ${min} to ${max}` : `of ${min} or more`}.
        </span>
      )}
    </div>
  );
}
