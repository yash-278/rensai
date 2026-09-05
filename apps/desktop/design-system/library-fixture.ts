// The review never opens a database or imports into the user's library.
import type { Series } from '@tiyo/common';
export const goToSeries = (series: Series, navigate: (path: string) => void) => {
  navigate(`/series/${series.id}`);
};
