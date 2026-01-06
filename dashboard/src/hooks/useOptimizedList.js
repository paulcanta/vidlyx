import { useMemo, useCallback } from 'react';

/**
 * useOptimizedList Hook
 *
 * Optimizes list rendering with memoization for filtering and sorting
 * Prevents unnecessary re-renders and computations
 *
 * @param {Array} items - Array of items to process
 * @param {Object} options - Configuration options
 * @param {Function} options.filterFn - Filter function (item) => boolean
 * @param {Function} options.sortFn - Sort function (a, b) => number
 * @param {Array} options.dependencies - Additional dependencies for memoization
 * @returns {Object} - Processed items and utility functions
 *
 * @example
 * const { items, filteredCount, totalCount } = useOptimizedList(videos, {
 *   filterFn: (video) => video.title.includes(searchQuery),
 *   sortFn: (a, b) => new Date(b.created_at) - new Date(a.created_at),
 *   dependencies: [searchQuery]
 * });
 */
export function useOptimizedList(items = [], options = {}) {
  const {
    filterFn = null,
    sortFn = null,
    dependencies = []
  } = options;

  // Memoize filtered items
  const filteredItems = useMemo(() => {
    if (!filterFn) return items;
    return items.filter(filterFn);
  }, [items, filterFn, ...dependencies]);

  // Memoize sorted items
  const processedItems = useMemo(() => {
    if (!sortFn) return filteredItems;
    return [...filteredItems].sort(sortFn);
  }, [filteredItems, sortFn]);

  // Memoize counts
  const totalCount = useMemo(() => items.length, [items]);
  const filteredCount = useMemo(() => processedItems.length, [processedItems]);

  return {
    items: processedItems,
    filteredCount,
    totalCount,
    isFiltered: filteredCount !== totalCount
  };
}

/**
 * useMemoizedRenderItem Hook
 *
 * Creates a memoized render function for list items
 * Prevents re-rendering items when parent component updates
 *
 * @param {Function} renderFn - Render function (item, index) => JSX
 * @param {Array} dependencies - Dependencies for the render function
 * @returns {Function} Memoized render function
 *
 * @example
 * const renderItem = useMemoizedRenderItem((video, index) => (
 *   <VideoCard key={video.id} video={video} />
 * ), []);
 */
export function useMemoizedRenderItem(renderFn, dependencies = []) {
  return useCallback(renderFn, dependencies);
}

/**
 * useGroupedList Hook
 *
 * Groups items by a specified key
 *
 * @param {Array} items - Array of items to group
 * @param {Function} groupByFn - Function to extract group key (item) => key
 * @param {Array} dependencies - Additional dependencies
 * @returns {Object} Grouped items
 *
 * @example
 * const grouped = useGroupedList(videos, (video) => video.folder_id);
 */
export function useGroupedList(items = [], groupByFn, dependencies = []) {
  return useMemo(() => {
    const groups = {};

    items.forEach(item => {
      const key = groupByFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return groups;
  }, [items, groupByFn, ...dependencies]);
}

/**
 * usePaginatedList Hook
 *
 * Paginates a list of items
 *
 * @param {Array} items - Array of items to paginate
 * @param {number} pageSize - Number of items per page
 * @param {number} currentPage - Current page number (1-based)
 * @returns {Object} Paginated data and navigation functions
 *
 * @example
 * const { items, totalPages, hasNext, hasPrev, goToPage } = usePaginatedList(videos, 20, page);
 */
export function usePaginatedList(items = [], pageSize = 20, currentPage = 1) {
  const totalPages = useMemo(
    () => Math.ceil(items.length / pageSize),
    [items.length, pageSize]
  );

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, pageSize]);

  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  return {
    items: paginatedItems,
    totalPages,
    currentPage,
    hasNext,
    hasPrev,
    totalItems: items.length
  };
}

export default useOptimizedList;
