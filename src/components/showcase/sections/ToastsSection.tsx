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
              title: "ECL computed successfully",
              description: "Total ECL: ₦1.84B across 3 stages.",
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
              title: "PD matrix updated",
              description: "Changes will apply on next run.",
            })
          }
        >
          Info toast
        </Button>
      </Row>
    </S>
  );
}
