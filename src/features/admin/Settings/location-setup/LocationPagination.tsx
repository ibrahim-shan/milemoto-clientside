'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/pagination';

// <-- Import new component

export function LocationPagination() {
  // In a real app, page, totalPages, and setPage would come from props/state
  const currentPage = 1;
  const totalPages = 5; // Example total

  return (
    <div className="flex items-center justify-between pt-4">
      {/* Left side: Page info */}
      <div className="text-muted-foreground text-sm">
        Page {currentPage} of {totalPages}
      </div>

      {/* Right side: Pagination controls */}
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              // Add disabled state logic:
              // disabled={currentPage === 1}
              // className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
            />
          </PaginationItem>

          {/* In a real app, you would map over page numbers here */}
          <PaginationItem>
            <PaginationLink
              href="#"
              isActive
            >
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              // Add disabled state logic:
              // disabled={currentPage === totalPages}
              // className={currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
