type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function StaffPager({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="staff-pager" role="navigation" aria-label="Pagination">
      <span className="staff-pager-meta">
        {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
      </span>
      <div className="staff-pager-btns">
        <button
          type="button"
          className="staff-pager-btn"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Back
        </button>
        <span className="staff-pager-num">
          Page {total === 0 ? 0 : safePage} of {total === 0 ? 0 : totalPages}
        </span>
        <button
          type="button"
          className="staff-pager-btn"
          disabled={safePage >= totalPages || total === 0}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
