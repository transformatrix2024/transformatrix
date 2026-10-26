import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

export function FormField({
  label,
  htmlFor,
  description,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor: string;
  description?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {description && !error && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
