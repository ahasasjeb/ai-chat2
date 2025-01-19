import { Select, SelectItem } from "@nextui-org/react";

export const models = [
  { label: 'GPT-4o-mini', value: 'gpt-4o-mini' },
  { label: 'deepseek-chat', value: 'deepseek-chat' }
] as const;

export type ModelType = typeof models[number]['value'];

interface ModelSelectorProps {
  value: ModelType;
  onChange: (value: ModelType) => void;
  disabled?: boolean;
}

export default function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  return (
    <Select
      label="选择模型"
      selectedKeys={[value]}
      onChange={(e) => onChange(e.target.value as ModelType)}
      disabled={disabled}
      classNames={{
        base: "max-w-[180px]",
        trigger: "bg-blue-600 hover:bg-blue-500 border-2 border-blue-400",
        value: "text-white font-semibold",
        label: "text-blue-100 font-medium",
        listbox: "bg-blue-600 border-2 border-blue-400",
      }}
    >
      {models.map((model) => (
        <SelectItem 
          key={model.value} 
          value={model.value}
          className="text-white data-[selected=true]:bg-blue-800 data-[hover=true]:bg-blue-500 font-medium"
        >
          {model.label}
        </SelectItem>
      ))}
    </Select>
  );
}
