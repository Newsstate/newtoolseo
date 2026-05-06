export function detectBrandRank(
  response: string,
  brand: string
) {
  const lines = response.toLowerCase().split("\n");

  let rank: number | null = null;

  lines.forEach((line, i) => {
    if (line.includes(brand.toLowerCase())) {
      if (!rank) rank = i + 1;
    }
  });

  return {
    found: rank !== null,
    rank,
  };
}
