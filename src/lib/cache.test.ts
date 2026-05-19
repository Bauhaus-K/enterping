import { clearInMemoryCache, getCachedValue } from "./cache";

describe("getCachedValue", () => {
  beforeEach(() => {
    clearInMemoryCache();
  });

  it("returns cached values within the ttl window", async () => {
    const fetcher = jest.fn(async () => "fresh-value");

    await expect(getCachedValue({ key: "leaderboard:test", ttlMs: 1000, fetcher })).resolves.toBe(
      "fresh-value",
    );
    await expect(getCachedValue({ key: "leaderboard:test", ttlMs: 1000, fetcher })).resolves.toBe(
      "fresh-value",
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("can clear values by prefix", async () => {
    const firstFetcher = jest.fn(async () => "first");
    const secondFetcher = jest.fn(async () => "second");

    await getCachedValue({ key: "leaderboard:a", ttlMs: 1000, fetcher: firstFetcher });
    clearInMemoryCache("leaderboard:");
    await getCachedValue({ key: "leaderboard:a", ttlMs: 1000, fetcher: secondFetcher });

    expect(firstFetcher).toHaveBeenCalledTimes(1);
    expect(secondFetcher).toHaveBeenCalledTimes(1);
  });
});
