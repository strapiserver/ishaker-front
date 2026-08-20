const SPLASH_OWNERSHIP_FILTERS = [
  "filters[author][username][$eq]",
  "filters[author][id][$eq]",
  "filters[$or][0][author][username][$eq]",
  "filters[$or][1][author][id][$eq]",
] as const;

type RequestError = {
  status?: number;
};

export const requestWithSplashOwnershipFallback = async <T>(
  params: URLSearchParams,
  request: (query: URLSearchParams) => Promise<T>,
  warn: () => void = () =>
    console.warn(
      "Splash ownership filtering is unsupported; using the compatible query.",
    ),
) => {
  try {
    return await request(params);
  } catch (error) {
    // The deployed Strapi schema can predate splash.author and reports an
    // internal error for relation filters. Retry only that known compatibility
    // failure; all other upstream errors must still fail the save.
    if ((error as RequestError).status !== 500) throw error;

    const compatibleParams = new URLSearchParams(params);
    SPLASH_OWNERSHIP_FILTERS.forEach((filter) =>
      compatibleParams.delete(filter),
    );
    warn();
    return request(compatibleParams);
  }
};
