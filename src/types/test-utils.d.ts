declare global {
  interface MockFetchResponse {
    ok: boolean
    status?: number
    headers?: Headers
    json: () => Promise<unknown>
    text?: () => Promise<string>
  }

  type MockFetch = jest.Mock<Promise<MockFetchResponse>, [input?: RequestInfo | URL, init?: RequestInit]>
}

export {}
