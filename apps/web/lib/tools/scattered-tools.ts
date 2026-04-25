/**
 * Scattered REST-style tools for the baseline agent. Each tool returns one
 * narrow slice of data, so the model is forced to chain multiple calls (and
 * frequently re-call as it refines its query). Same underlying data as the
 * federated supergraph; the only difference is the API surface area.
 */
import { __TEST_FLIGHTS, __TEST_POLICY } from "@/lib/wundergraph/federation";

export type SearchFlightsResult = { flightIds: string[] };
export type FlightDetails = {
  id: string;
  airline: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
};
export type FlightPrice = { id: string; price: number; refundable: boolean };
export type PolicyResult = { maxPrice: number; refundableRequired: boolean };

export function search_flights(args: { from: string; to: string; date: string }): SearchFlightsResult {
  const matches = __TEST_FLIGHTS.filter(
    (f) =>
      f.from.toUpperCase() === args.from.toUpperCase() &&
      f.to.toUpperCase() === args.to.toUpperCase()
  );
  return { flightIds: matches.map((f) => f.id) };
}

export function get_flight_details(args: { flightId: string }): FlightDetails | { error: string } {
  const f = __TEST_FLIGHTS.find((x) => x.id === args.flightId);
  if (!f) return { error: `Flight ${args.flightId} not found` };
  return {
    id: f.id,
    airline: f.airline,
    from: f.from,
    to: f.to,
    departTime: f.departTime,
    arriveTime: f.arriveTime,
  };
}

export function get_flight_price(args: { flightId: string }): FlightPrice | { error: string } {
  const f = __TEST_FLIGHTS.find((x) => x.id === args.flightId);
  if (!f) return { error: `Flight ${args.flightId} not found` };
  return { id: f.id, price: f.price, refundable: f.refundable };
}

export function check_policy(): PolicyResult {
  return { maxPrice: __TEST_POLICY.maxPrice, refundableRequired: __TEST_POLICY.refundableRequired };
}
