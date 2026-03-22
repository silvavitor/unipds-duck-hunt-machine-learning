const urlQueryString = new URLSearchParams(window.location.search);

function parseQueryParamAsInt(param: string): number {
  return parseInt(urlQueryString.get(param) as string, 10);
}

export function parseLevelQueryString() {
  return {
    id: -1,
    title: urlQueryString.get("title") || "Generated Level",
    waves: parseQueryParamAsInt("waves") || 1,
    ducks: parseQueryParamAsInt("ducks") || 1,
    pointsPerDuck: parseQueryParamAsInt("points") || 100,
    speed: parseQueryParamAsInt("speed") || 8,
    bullets: parseQueryParamAsInt("bullets") || 100,
    radius: parseQueryParamAsInt("radius") || 60,
    time: parseQueryParamAsInt("time") || 30,
  };
}

export function urlContainsLevelData(): boolean {
  return window.location.href.indexOf("?") !== -1;
}

export default { parseLevelQueryString, urlContainsLevelData };
