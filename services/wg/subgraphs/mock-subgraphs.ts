type FlightResult = {
  id: string;
  price: number;
  refundable: boolean;
  airline: string;
  departure: string;
  arrival: string;
};

type PolicyResult = {
  maxPrice: number;
  refundableRequired: boolean;
  preferredAirlines: string[];
};

export const flightsSubgraph = {
  typeDefs: `
    type Flight {
      id: ID!
      price: Float!
      refundable: Boolean!
      airline: String!
      departure: String!
      arrival: String!
      from: String!
      to: String!
    }

    type Query {
      flights(from: String!, to: String!, date: String!): [Flight!]!
      refundableFlights(from: String!, to: String!, date: String!, maxPrice: Float): [Flight!]!
    }
  `,
  
  resolvers: {
    Query: {
      flights: (_: any, args: { from: string; to: string; date: string }): FlightResult[] => {
        return [
          {
            id: 'UA123',
            price: 380,
            refundable: true,
            airline: 'United',
            departure: '2026-05-02T08:00:00Z',
            arrival: '2026-05-02T16:30:00Z',
            from: args.from,
            to: args.to,
          },
          {
            id: 'DL456',
            price: 420,
            refundable: false,
            airline: 'Delta',
            departure: '2026-05-02T09:00:00Z',
            arrival: '2026-05-02T17:45:00Z',
            from: args.from,
            to: args.to,
          },
          {
            id: 'AA789',
            price: 395,
            refundable: true,
            airline: 'American',
            departure: '2026-05-02T10:00:00Z',
            arrival: '2026-05-02T18:30:00Z',
            from: args.from,
            to: args.to,
          },
        ];
      },
      
      refundableFlights: (_: any, args: { from: string; to: string; date: string; maxPrice?: number }): FlightResult[] => {
        const allFlights = [
          {
            id: 'UA123',
            price: 380,
            refundable: true,
            airline: 'United',
            departure: '2026-05-02T08:00:00Z',
            arrival: '2026-05-02T16:30:00Z',
            from: args.from,
            to: args.to,
          },
          {
            id: 'AA789',
            price: 395,
            refundable: true,
            airline: 'American',
            departure: '2026-05-02T10:00:00Z',
            arrival: '2026-05-02T18:30:00Z',
            from: args.from,
            to: args.to,
          },
        ];
        
        if (args.maxPrice) {
          return allFlights.filter(f => f.price <= args.maxPrice!);
        }
        
        return allFlights;
      },
    },
  },
};

export const policySubgraph = {
  typeDefs: `
    type TravelPolicy {
      maxPrice: Float!
      refundableRequired: Boolean!
      preferredAirlines: [String!]!
    }

    type Query {
      travelPolicy(userId: String): TravelPolicy!
    }
  `,
  
  resolvers: {
    Query: {
      travelPolicy: (_: any, args: { userId?: string }): PolicyResult => {
        return {
          maxPrice: 400,
          refundableRequired: true,
          preferredAirlines: ['United', 'American'],
        };
      },
    },
  },
};
