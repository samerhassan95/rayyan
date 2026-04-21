'use client'
import React from 'react'
import Image from 'next/image'

export type ColumnType =
  | 'text' | 'description' | 'date' | 'badge' | 'user' | 'statusِActive' | 'userEmail'
  | 'amount' | 'status' | 'progress' | 'plan' | 'lastActive' | 'action';

export interface Column {
  key: string;
  label: string;
  type: ColumnType;
  widthClass?: string;
  minWidthClass?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title?: string;
  description?: string;
  columns: Column[];
  data: any[];
  isRTL?: boolean;
  emptyMessage?: string;
  filterSection?: React.ReactNode;
  footerSection?: React.ReactNode;
}

const DataTable = ({
  title,
  description,
  columns,
  data,
  isRTL,
  emptyMessage = 'No data found',
  filterSection,
  footerSection
}: DataTableProps) => {

  const renderCell = (row: any, col: Column) => {
    const value = row[col.key];
    if (col.render) return col.render(value, row);

    switch (col.type) {
      case 'userEmail':
        return (
          <div className="flex items-center gap-3">
            {row.image ? (
              <img src={row.image} alt={value} className="object-cover w-10 h-10 rounded-full shrink-0" />
            ) : (
              <div className="flex items-center justify-center w-10 h-10 font-bold rounded-full bg-primary/10 text-primary shrink-0">
                {value?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-gray-900 truncate">{value || 'Unknown'}</span>
              <span className="text-xs text-gray-500 truncate">{row.email}</span>
            </div>
          </div>
        );
      case 'user':
        return (
          <div className="flex items-center gap-3">
            {row.image ? (
              <img src={row.image} alt={value} className="object-cover w-10 h-10 rounded-full shrink-0" />
            ) : (
              <div className="flex items-center justify-center w-8 h-8  text-white rounded-full bg-gradient-to-br from-[#488981] to-[#51D1B8] shrink-0">
                {value?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-gray-900 truncate">{value || 'Unknown'}</span>
              {/* <span className="text-xs text-gray-500 truncate">{row.email}</span> */}
            </div>
          </div>
        );

      case 'date':
        return (
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {new Date(value).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
        );

      case 'amount':
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">
              {row.currency || '$'}{parseFloat(value || 0).toLocaleString()}
            </span>
          </div>
        );

      case 'statusِActive': // Active status with dot
        const isActive = value?.toLowerCase() === 'active';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
            {value}
          </span>
        );

      case 'status': // Active status with dot
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium `}>
            {value}
          </span>
        );

      case 'progress':
        const statusColors: any = {
          complete: 'bg-blue-50 text-blue-700',
          pending: 'bg-yellow-50 text-yellow-700',
          cancelled: 'bg-gray-50 text-gray-700',
          failed: 'bg-red-50 text-red-700',
          successful: 'bg-green-50 text-green-700',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[value?.toLowerCase()] || 'bg-gray-50 text-gray-700'}`}>
            {value}
          </span>
        );

      case 'description':
        return <p className="max-w-full text-sm text-gray-500 truncate" title={value}>{value}</p>;

      case 'badge': // Custom Badge (expects row.badgeColor and row.badgeBg)
        return (
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ color: row.badgeColor, backgroundColor: row.badgeBg }}
          >
            {value}
          </span>
        );

      case 'plan':
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{value}</span>
            <span className="text-xs text-gray-500">{row.planPrice}</span>
          </div>
        );

      case 'lastActive':
        return <span className="text-sm text-gray-500">{value}</span>;

      case 'action':
        return <button className="p-1 text-xl text-gray-400 transition-colors hover:text-gray-600">⋯</button>;

      default:
        return <span className="text-sm text-gray-700">{value}</span>;
    }
  };

  return (
    <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 p-6 border-b md:flex-row md:items-center border-gray-50">
        <div className="space-y-1">
          {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        <div className="shrink-0">{filterSection}</div>
      </div>

      {/* Overflow Container */}
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse table-auto">
          <thead className="bg-[#F9FAFB]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    p-4 text-xs font-semibold text-gray-500 uppercase px-6
                    ${isRTL ? 'text-right' : 'text-left'}
                    ${col.widthClass || ''} 
                    ${col.minWidthClass || 'min-w-[140px]'}
                  `}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length > 0 ? (
              <>
                {data.map((row, rowIndex) => (
                  <tr key={row.id || rowIndex} className={`transition-colors ${row.isEmpty ? '' : 'hover:bg-gray-50/50'}`}>
                    {columns.map((col) => (
                      <td key={col.key} className="p-4 align-middle px-6 min-h-[60px]">
                        {/* لو الصف فاضي اعرض مساحة فاضية، لو فيه داتا اعرض الـ Cell */}
                        {row.isEmpty ? <div className="h-6"></div> : renderCell(row, col)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* لو لسه مكملناش 5 صفوف والداتا أصلاً موجودة (مثلاً داتا فيها عنصرين بس) */}
                {data.length < 5 && Array.from({ length: 5 - data.length }).map((_, i) => (
                  <tr key={`empty-row-${i}`} className="border-none">
                    {columns.map((col) => (
                      <td key={`empty-cell-${i}-${col.key}`} className="p-4 px-6">
                        <div className="h-6"></div> {/* صف شفاف للحفاظ على الارتفاع */}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : (
              /* حالة الـ No Data Found */
              <tr>
                <td colSpan={columns.length} className="p-10 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {footerSection && (
        <div className="p-4 border-t border-gray-50">
          {footerSection}
        </div>
      )}
    </div>
  )
}

export default DataTable;