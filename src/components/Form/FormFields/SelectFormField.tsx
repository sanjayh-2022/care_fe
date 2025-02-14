import FormField from "@/components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";
import SelectMenuV2 from "@/components/Form/SelectMenuV2";

type OptionCallback<T, R> = (option: T) => R;

type SelectFormFieldProps<T, V = T> = FormFieldBaseProps<V> & {
  placeholder?: React.ReactNode;
  options: readonly T[];
  position?: "above" | "below";
  optionLabel: OptionCallback<T, React.ReactNode>;
  optionSelectedLabel?: OptionCallback<T, React.ReactNode>;
  optionDescription?: OptionCallback<T, React.ReactNode>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  optionValue?: OptionCallback<T, V>;
  optionDisabled?: OptionCallback<T, boolean>;
  inputClassName?: string;
};

/**
 * @deprecated use shadcn/ui's select instead
 */
export const SelectFormField = <T, V>(props: SelectFormFieldProps<T, V>) => {
  const field = useFormFieldPropsResolver<V>(props);
  return (
    <FormField field={field}>
      <SelectMenuV2
        id={field.id}
        options={props.options}
        disabled={field.disabled}
        value={field.value}
        required={field.required}
        onChange={(value: any) => field.handleChange(value)}
        position={props.position}
        placeholder={props.placeholder}
        optionLabel={props.optionLabel}
        inputClassName={props.inputClassName}
        optionSelectedLabel={props.optionSelectedLabel}
        optionDescription={props.optionDescription}
        optionIcon={props.optionIcon}
        optionValue={props.optionValue}
        optionDisabled={props.optionDisabled}
        requiredError={field.error ? props.required : false}
      />
    </FormField>
  );
};
