import { Button } from "../..";
import { S, Row } from "../helpers";
import { Download, Plus, Sparkles, Settings } from "lucide-react";

export function ButtonsSection() {
  return (
    <S label="Buttons">
      <Row label="Variants">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="solid">Solid</Button>
        <Button variant="danger">Danger</Button>
      </Row>
      <Row label="Sizes">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </Row>
      <Row label="Icons">
        <Button leftIcon={<Plus className="h-4 w-4" />}>Add Scenario</Button>
        <Button rightIcon={<Download className="h-4 w-4" />} variant="outline">
          Export
        </Button>
        <Button
          leftIcon={<Sparkles className="h-4 w-4" />}
          rightIcon={<Settings className="h-4 w-4" />}
          variant="solid"
        >
          Configure
        </Button>
      </Row>
      <Row label="States">
        <Button loading>Computing…</Button>
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>
          Disabled
        </Button>
      </Row>
    </S>
  );
}
