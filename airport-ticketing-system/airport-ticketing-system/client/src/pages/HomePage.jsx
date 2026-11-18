import { useSearchParams } from 'react-router-dom';
import { airportApi, flightApi } from '../api';
import useAsync from '../hooks/useAsync';
import SearchBar from '../components/SearchBar';
import FlightGrid from '../components/FlightGrid';
import Pagination from '../components/Pagination';
import { Alert, EmptyState, Spinner } from '../components/Feedback';
import { localDayRange } from '../utils/format';

const SEARCH_KEYS = ['origin', 'destination', 'date', 'seatClass', 'sort'];

export default function HomePage() {
  // The URL is the single source of truth, so searches are shareable and survive refresh.
  const [params, setParams] = useSearchParams();
  const criteria = Object.fromEntries(SEARCH_KEYS.map((key) => [key, params.get(key) || '']));
  if (!criteria.sort) criteria.sort = 'departure';
  const page = Number(params.get('page')) || 1;

  const airports = useAsync(() => airportApi.list(), []);
  const results = useAsync(
    () => flightApi.search({
      origin: criteria.origin,
      destination: criteria.destination,
      seatClass: criteria.seatClass,
      sort: criteria.sort,
      page,
      limit: 12,
      ...localDayRange(criteria.date),
    }),
    [params.toString()]
  );

  const handleSearch = (form) => {
    const next = Object.fromEntries(Object.entries(form).filter(([, value]) => value));
    setParams(next);
  };

  const changePage = (nextPage) => {
    const next = new URLSearchParams(params);
    next.set('page', nextPage);
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Where are you flying next?</h1>
          <p>Search flights across East Africa, book in minutes, pick your seat and check in online.</p>
          {airports.data && (
            <SearchBar
              key={params.toString()}
              airports={airports.data}
              initial={criteria}
              onSearch={handleSearch}
            />
          )}
        </div>
      </section>

      <section className="container section">
        <div className="section__head">
          <h2>Available flights</h2>
          {results.data && <span className="muted">{results.data.total} found</span>}
        </div>

        {results.loading && <Spinner label="Searching flights…" />}
        <Alert>{results.error?.message}</Alert>

        {results.data && results.data.flights.length === 0 && (
          <EmptyState title="No flights match your search">
            Try another date, a different cabin, or clear the airport filters.
          </EmptyState>
        )}

        {results.data && results.data.flights.length > 0 && (
          <>
            <FlightGrid flights={results.data.flights} />
            <Pagination page={results.data.page} pages={results.data.pages} onChange={changePage} />
          </>
        )}
      </section>
    </>
  );
}
