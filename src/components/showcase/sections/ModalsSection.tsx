import { Button, Modal, toaster } from "../..";
import { S, Row } from "../helpers";
import { LayoutDashboard } from "lucide-react";

interface Props {
  modalOpen: boolean;
  setModalOpen: (v: boolean) => void;
}

export function ModalsSection({ modalOpen, setModalOpen }: Props) {
  return (
    <S label="Modals">
      <Row>
        <Button
          onClick={() => setModalOpen(true)}
          leftIcon={<LayoutDashboard className="h-4 w-4" />}
        >
          Open Modal
        </Button>
      </Row>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        title="Confirm ECL Recalculation"
        description="This will recompute all ECL figures using the latest macro scenario."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setModalOpen(false);
                toaster.success({
                  title: "Recalculation started",
                  description: "Results will be ready in ~2 minutes.",
                });
              }}
            >
              Recalculate
            </Button>
          </>
        }
      >
        <p className="text-sm text-dark-gray/70">
          All existing ECL results for the <strong>December 2024</strong>{" "}
          reporting period will be overwritten. Ensure all macro scenarios and
          PD matrices have been reviewed.
        </p>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠ This action cannot be undone without restoring from a snapshot.
        </div>
      </Modal>
    </S>
  );
}
