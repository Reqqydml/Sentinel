import { ReactNode } from 'react';

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T;
  onRowClick?: (item: T) => void;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  striped?: boolean;
  hover?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  className = '',
  loading = false,
  emptyMessage = 'No data available',
  striped = true,
  hover = true,
}: DataTableProps<T>) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm border-collapse">
        <thead className="border-b border-border bg-muted/30">
          <tr>
            {columns.map(col => (
              <th
                key={String(col.key)}
                className={`text-left px-4 py-3 font-semibold text-muted-foreground ${col.headerClassName || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={String(item[rowKey])}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-border/50 transition ${
                  striped && idx % 2 === 1 ? 'bg-muted/10' : ''
                } ${hover && onRowClick ? 'hover:bg-muted/30 cursor-pointer' : ''}`}
              >
                {columns.map(col => (
                  <td key={String(col.key)} className={`px-4 py-3 ${col.className || ''}`}>
                    {col.render ? col.render(item[col.key], item) : String(item[col.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
