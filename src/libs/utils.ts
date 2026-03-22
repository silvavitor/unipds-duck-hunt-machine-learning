export function pointDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number },
): number {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2),
  );
}

export function directionOfTravel(
  pointStart: { x: number; y: number },
  pointEnd: { x: number; y: number },
): string {
  let direction = "";

  //positive means down
  const rise = pointEnd.y - pointStart.y;
  //positive means right
  const run = pointEnd.x - pointStart.x;

  if (run < 1 && rise < 1) {
    direction = "top-left";
  } else if (run < 1 && rise > 1) {
    direction = "bottom-left";
  } else if (run > 1 && rise < 1) {
    direction = "top-right";
  } else if (run > 1 && rise > 1) {
    direction = "bottom-right";
  }

  if (run !== 0 && Math.abs(rise / run) < 0.3) {
    if (run > 1) {
      direction = "right";
    } else {
      direction = "left";
    }
  }

  return direction;
}

export function toggleFullscreen(): void {
  const doc = window.document;
  const docEl = doc.documentElement;

  const requestFullScreen =
    (docEl as any).requestFullscreen ||
    (docEl as any).mozRequestFullScreen ||
    (docEl as any).webkitRequestFullScreen ||
    (docEl as any).msRequestFullscreen;
  const cancelFullScreen =
    (doc as any).exitFullscreen ||
    (doc as any).mozCancelFullScreen ||
    (doc as any).webkitExitFullscreen ||
    (doc as any).msExitFullscreen;

  if (
    !(doc as any).fullscreenElement &&
    !(doc as any).mozFullScreenElement &&
    !(doc as any).webkitFullscreenElement &&
    !(doc as any).msFullscreenElement
  ) {
    requestFullScreen.call(docEl);
  } else {
    cancelFullScreen.call(doc);
  }
}

export default { pointDistance, directionOfTravel, toggleFullscreen };
