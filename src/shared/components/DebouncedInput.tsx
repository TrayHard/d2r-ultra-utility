import React from "react";

interface DebouncedInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value,
  onChange,
  delay = 300,
  ...rest
}) => {
  const [innerValue, setInnerValue] = React.useState<string>(value ?? "");
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setInnerValue(value ?? "");
  }, [value]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const v = e.target.value;
    setInnerValue(v);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onChange(v);
    }, delay);
  };

  return <input {...rest} value={innerValue} onChange={handleChange} />;
};

export default DebouncedInput;
