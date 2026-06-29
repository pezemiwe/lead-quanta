import { Button, toaster } from "../..";
import { S, Row } from "../helpers";

export function ToastsSection() {
  return (
    <S label="Toasts">
      <Row>
        <Button
          variant="outline"
          onClick={() =>
            toaster.success({
              title: "Valuation run complete",
              description: "Portfolio marked-to-market. 68 instruments repriced.",
            })
          }
        >
          Success toast
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toaster.error({
              title: "Calculation failed",
              description: "Missing macro scenario for Q4 2024.",
            })
          }
        >
          Error toast
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toaster.info({
              title: "Yield curve updated",
              description: "FGN curve refreshed. Revaluation triggered.",
            })
          }
        >
          Info toast
        </Button>
      </Row>
    </S>
  );
}
