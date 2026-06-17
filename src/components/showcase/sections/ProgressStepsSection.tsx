import { ProgressSteps } from "../..";
import { S, Row } from "../helpers";
import { STEPS } from "../data";

export function ProgressStepsSection() {
  return (
    <S label="Progress Steps">
      <Row label="Horizontal">
        <div className="w-full">
          <ProgressSteps steps={STEPS} orientation="horizontal" />
        </div>
      </Row>
      <Row label="Vertical">
        <ProgressSteps steps={STEPS} orientation="vertical" />
      </Row>
      <Row label="All states">
        <ProgressSteps
          orientation="horizontal"
          className="w-full max-w-md"
          steps={[
            { id: "1", label: "Completed", status: "completed" },
            { id: "2", label: "Active", status: "active" },
            { id: "3", label: "Pending", status: "pending" },
            { id: "4", label: "Error", status: "error" },
          ]}
        />
      </Row>
    </S>
  );
}
