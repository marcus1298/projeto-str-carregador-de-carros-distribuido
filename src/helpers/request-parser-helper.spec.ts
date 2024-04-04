import { parseRequest } from './request-parser.helper';

describe('parseRequest', () => {
  it('should parse JSON request body', () => {
    const request = { body: '{"foo": "bar"}', query: {} };

    const result = parseRequest(request);

    expect(result).toEqual({ foo: 'bar' });
  });

  it('should return empty object for non-JSON request body', () => {
    const request = { body: 'foo=bar', query: {} };

    const result = parseRequest(request);

    expect(result).toEqual({});
  });

  it('should merge body and query parameters', () => {
    const request = { body: '{"foo": "bar"}', query: { baz: 'qux' } };

    const result = parseRequest(request);

    expect(result).toEqual({ foo: 'bar', baz: 'qux' });
  });

  it('should return empty object if JSON parsing fails', () => {
    const request = { body: '{foo: bar}', query: {} };

    const result = parseRequest(request);

    expect(result).toEqual({});
  });
});