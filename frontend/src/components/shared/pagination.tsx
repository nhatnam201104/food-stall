import { Pagination } from 'antd';
import React from 'react';

interface CustomPaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  showSizeChanger?: boolean;
}

export const CustomPagination: React.FC<CustomPaginationProps> = ({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger = true,
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
      <Pagination
        current={current}
        pageSize={pageSize}
        total={total}
        onChange={onChange}
        showSizeChanger={showSizeChanger}
        showTotal={(totalCount) => `Total ${totalCount} items`}
      />
    </div>
  );
};
