import React from 'react';
import NumberedPagination from './NumberedPagination';
import './ListPagination.css';

const ListPagination = ({
  currentPage,
  totalPages,
  totalItems,
  rangeStart,
  rangeEnd,
  onPageChange,
  itemLabel = 'items',
  className = '',
}) => {
  if (totalItems === 0) return null;

  return (
    <div className={`list-pagination-footer ${className}`.trim()}>
      <div className="list-pagination-info">
        {totalPages > 1
          ? `Showing ${rangeStart}–${rangeEnd} of ${totalItems.toLocaleString()} ${itemLabel}`
          : `Showing ${totalItems.toLocaleString()} ${itemLabel}`}
      </div>
      {totalPages > 1 && (
        <NumberedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default ListPagination;
