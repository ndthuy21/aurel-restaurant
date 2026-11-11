export function PageHeading({
  number,
  title,
  accent,
  description,
}: {
  number: string;
  title: string;
  accent: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">{number} / THE AUREL EXPERIENCE</span>
      <h1>
        {title} <em>{accent}</em>
      </h1>
      <p>{description}</p>
    </div>
  );
}
