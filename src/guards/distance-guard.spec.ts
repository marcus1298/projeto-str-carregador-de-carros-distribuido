import { DistanceGuard } from './distance.guard';

describe('DistanceGuard', () => {
  const maxDistance = 5000;
  let guard: any;

  beforeEach(() => {
    guard = new (DistanceGuard(maxDistance))();
  });

  describe('canActivate', () => {
    const context = {
      switchToHttp: jest.fn(() => {
        return {
          getRequest: jest.fn(() => {
            return {
              query: { force: false },
              body: {
                metadata: {
                  user: { latitude: 37.7749, longitude: -122.4194 },
                  station: { latitude: 37.7749, longitude: -122.4194 },
                },
              },
            } as any;
          }),
        };
      }),
    };

    it('should allow access if force parameter is set', () => {
      context.switchToHttp.mockReturnValueOnce({
        getRequest: jest.fn(() => {
          return {
            query: { force: true },
          };
        }),
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access if user is within the maximum distance from the station', () => {
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw a BadRequestException if user is too far from the station', () => {
      context.switchToHttp.mockReturnValueOnce({
        getRequest: jest.fn(() => {
          return {
            query: { force: false },
            body: {
              metadata: {
                user: { latitude: 37.7749, longitude: -122.4194 },
                station: { latitude: 37.7749, longitude: -74.006 },
              },
            },
          };
        }),
      });

      expect(() => guard.canActivate(context)).toThrowError();
    });

    it('should return true if metadata is missing', () => {
      context.switchToHttp.mockReturnValueOnce({
        getRequest: jest.fn(() => {
          return {
            query: undefined,
            body: undefined,
          };
        }),
      });

      expect(guard.canActivate(context)).toBe(true);

      context.switchToHttp.mockReturnValueOnce({
        getRequest: jest.fn(() => {
          return {
            query: { force: false },
            body: undefined,
          };
        }),
      });

      expect(guard.canActivate(context)).toBe(true);

      context.switchToHttp.mockReturnValueOnce({
        getRequest: jest.fn(() => {
          return {
            query: { force: false },
            body: {},
          };
        }),
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
