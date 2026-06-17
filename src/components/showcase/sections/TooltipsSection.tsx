import { Button, Badge, Tooltip } from "../..";
import { S, Row } from "../helpers";

export function TooltipsSection() {
  return (
    <S label="Tooltips">
      <Row label="Placements">
        {(["top", "bottom", "left", "right"] as const).map((p) => (
          <Tooltip key={p} content={`Placement: ${p}`} placement={p}>
            <Button size="sm" variant="outline">
              {p}
            </Button>
          </Tooltip>
        ))}
      </Row>
      <Row label="Rich content">
        <Tooltip
          content={
            <span>
              ECL = <strong>PD</strong> × <strong>LGD</strong> ×{" "}
              <strong>EAD</strong>
            </span>
          }
          placement="bottom"
        >
          <Badge variant="brand" className="cursor-help">
            ECL Formula ℹ
          </Badge>
        </Tooltip>
      </Row>
    </S>
  );
}
