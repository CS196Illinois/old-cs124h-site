export default function StaffCard({ member, onClick }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") onClick?.(member);
  };

  return (
    <div
      className="staff-card-box"
      onClick={() => onClick?.(member)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      key={member.id ?? member.name}
    >
      <div className="staff-image-box">
        <img src={member.image} alt={member.name} />
      </div>
      <p className="staff-card-text">{member.name}</p>
    </div>
  );
}