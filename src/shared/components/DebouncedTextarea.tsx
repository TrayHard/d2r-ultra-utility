import React from "react";

interface DebouncedTextareaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "onChange" | "value"
  > {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}

const DebouncedTextarea: React.FC<DebouncedTextareaProps> = ({
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

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const v = e.target.value;
    setInnerValue(v);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onChange(v);
    }, delay);
  };

  return <textarea {...rest} value={innerValue} onChange={handleChange} />;
};

export default DebouncedTextarea;
