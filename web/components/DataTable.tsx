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
  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-muted-foreground">
            {columns.map((col) => (
              <th key={String(col.key)} className={`text-left py-3 px-4 font-semibold ${col.headerClassName || ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={String(row[rowKey])}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-border/50 ${
                striped && idx % 2 === 0 ? 'bg-muted/20' : ''
              } ${hover && onRowClick ? 'hover:bg-muted/50 cursor-pointer' : ''} transition`}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className={`py-3 px-4 text-foreground ${col.className || ''}`}>
                  {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
