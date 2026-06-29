import { Badge } from "../..";
import { S, Row } from "../helpers";

export function BadgesSection() {
  return (
    <S label="Badges">
      <Row label="IFRS 13 Classification">
        <Badge variant="success">AC</Badge>
        <Badge variant="warning">FVOCI</Badge>
        <Badge variant="danger">FVTPL</Badge>
      </Row>
      <Row label="Credit Rating">
        <Badge variant="performing">Performing</Badge>
        <Badge variant="watch">Watch</Badge>
        <Badge variant="substandard">Substandard</Badge>
        <Badge variant="doubtful">Doubtful</Badge>
        <Badge variant="loss">Loss</Badge>
      </Row>
      <Row label="Loan Status">
        <Badge variant="active">Active</Badge>
        <Badge variant="default">Default</Badge>
        <Badge variant="written-off">Written-off</Badge>
      </Row>
      <Row label="General">
        <Badge variant="success" dot>
          Success
        </Badge>
        <Badge variant="warning" dot>
          Warning
        </Badge>
        <Badge variant="danger" dot>
          Danger
        </Badge>
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="brand">Brand</Badge>
      </Row>
      <Row label="Sizes">
        <Badge variant="brand" size="sm">
          Small
        </Badge>
        <Badge variant="brand" size="md">
          Medium
        </Badge>
        <Badge variant="brand" size="lg">
          Large
        </Badge>
      </Row>
    </S>
  );
}
