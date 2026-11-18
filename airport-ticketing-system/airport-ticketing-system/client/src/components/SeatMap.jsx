/**
 * Interactive cabin layout. Seats outside the passenger's cabin or already
 * taken are disabled; an aisle is drawn in the middle of each row.
 */
export default function SeatMap({ layout, seatClass, selected, currentSeat, onSelect }) {
  const { rows, letters, businessRows, occupied } = layout;
  const taken = new Set(occupied.filter((seat) => seat !== currentSeat));
  const aisleAfter = Math.ceil(letters.length / 2) - 1;

  return (
    <div className="seatmap" role="grid" aria-label="Seat map">
      <div className="seatmap__row seatmap__row--head" role="row">
        <span className="seatmap__num" />
        {letters.map((letter, i) => (
          <span key={letter} className={`seatmap__letter ${i === aisleAfter ? 'has-aisle' : ''}`}>{letter}</span>
        ))}
      </div>

      {Array.from({ length: rows }, (_, index) => {
        const row = index + 1;
        const cabin = row <= businessRows ? 'business' : 'economy';
        return (
          <div key={row} className={`seatmap__row seatmap__row--${cabin}`} role="row">
            <span className="seatmap__num">{row}</span>
            {letters.map((letter, i) => {
              const seat = `${row}${letter}`;
              const isTaken = taken.has(seat);
              const wrongCabin = cabin !== seatClass;
              const state = isTaken ? 'taken' : seat === selected ? 'selected' : wrongCabin ? 'locked' : 'free';
              return (
                <button
                  key={seat}
                  type="button"
                  role="gridcell"
                  className={`seat seat--${state} ${i === aisleAfter ? 'has-aisle' : ''}`}
                  disabled={isTaken || wrongCabin}
                  aria-pressed={seat === selected}
                  aria-label={`Seat ${seat}, ${cabin}${isTaken ? ', taken' : ''}`}
                  onClick={() => onSelect(seat)}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        );
      })}

      <div className="seatmap__legend">
        <span><i className="seat seat--free" /> Available</span>
        <span><i className="seat seat--selected" /> Your seat</span>
        <span><i className="seat seat--taken" /> Taken</span>
        <span><i className="seat seat--locked" /> Other cabin</span>
      </div>
    </div>
  );
}
