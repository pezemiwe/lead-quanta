import { Input, PasswordInput, Select } from "../..";
import { S } from "../helpers";
import { DollarSign, Search } from "lucide-react";

interface Props {
  inputVal: string;
  setInputVal: (v: string) => void;
  selectVal: string;
  setSelectVal: (v: string) => void;
}

export function InputsSection({
  inputVal,
  setInputVal,
  selectVal,
  setSelectVal,
}: Props) {
  return (
    <S label="Inputs & Select">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Loan ID"
          placeholder="e.g. L-00123"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          hint="Enter the unique loan reference."
        />
        <Input
          label="Outstanding Balance"
          placeholder="₦0.00"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <Input
          label="Search"
          placeholder="Search loans…"
          icon={<Search className="h-4 w-4" />}
          endAdornment={
            <span className="text-[11px] text-dark-gray/35">⌘K</span>
          }
        />
        <Input
          label="Error state"
          placeholder="Enter value"
          error="This field is required."
        />
        <Input label="Disabled" placeholder="Not editable" disabled />
        <PasswordInput
          label="API Secret"
          placeholder="Enter secret key"
          hint="Used for secure data exports."
        />
        <Select
          label="Classification"
          options={[
            { value: "AC", label: "AC — Amortised Cost" },
            { value: "FVOCI", label: "FVOCI — Fair Value through OCI" },
            { value: "FVTPL", label: "FVTPL — Fair Value through P&L" },
          ]}
          placeholder="Select classification…"
          value={selectVal}
          onChange={(e) => setSelectVal(e.target.value)}
        />
        <Select
          label="Select error"
          options={[{ value: "1", label: "Option 1" }]}
          placeholder="Pick one…"
          error="Selection required."
        />
      </div>
    </S>
  );
}
